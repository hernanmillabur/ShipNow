import { expect } from 'chai'
import request from 'supertest'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import DeliveryModel from '../src/models/delivery.model.js'
import { deliveriesRepository } from '../src/repositories/deliveries.repository.js'
import { usersRepository } from '../src/repositories/users.repository.js'
import { USER_ROLES } from '../src/constants/index.js'
import { swaggerSpec } from '../src/config/swagger.config.js'
import { createOrderFixture, createUserFixture, expectErrorResponse, nonexistentId } from './helpers/fixtures.js'
import { getTestApp } from './helpers/test-context.js'

const PDF = Buffer.from('%PDF-1.7\n% synthetic ShipNow upload test\n')
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])

const allFiles = async (directory = process.env.UPLOADS_DIR) => {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  const nested = await Promise.all(entries.map((entry) => (
    entry.isDirectory() ? allFiles(resolve(directory, entry.name)) : [resolve(directory, entry.name)]
  )))
  return nested.flat()
}

const expectNoFiles = async () => expect(await allFiles()).to.have.lengthOf(0)

const createDeliveryFixture = async () => {
  const order = await createOrderFixture()
  const driver = await createUserFixture({ role: USER_ROLES.DRIVER })
  return DeliveryModel.create({ orderId: order._id, driverId: driver._id })
}

const attachUserFile = (userId, name = 'identity.pdf', content = PDF, mimeType = 'application/pdf', documentType = 'identity') => {
  const req = request(getTestApp())
    .post(`/api/users/${userId}/documents`)
    .attach('file', content, { filename: name, contentType: mimeType })
  return documentType === undefined ? req : req.field('documentType', documentType)
}

const attachProof = (deliveryId, name = 'proof.pdf', content = PDF, mimeType = 'application/pdf') => request(getTestApp())
  .post(`/api/deliveries/${deliveryId}/proof`)
  .attach('file', content, { filename: name, contentType: mimeType })

describe('Uploads API', function () {
  describe('POST /api/users/:userId/documents', function () {
    it('guarda un documento válido y devuelve metadatos sin el contenido binario', async function () {
      const user = await createUserFixture()
      const response = await attachUserFile(user.id).expect(201)

      expect(response.body.status).to.equal('success')
      expect(response.body.payload.user._id).to.equal(user.id)
      expect(response.body.payload.user).not.to.have.property('documents')
      expect(response.body.payload.document).to.include({
        originalName: 'identity.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
        documentType: 'identity',
      })
      expect(response.body.payload.document.generatedName).to.match(/^[\da-f-]{36}\.pdf$/i)
      expect(response.body.payload.document.relativePath).to.match(new RegExp(`^users/${user.id}/[\\da-f-]{36}\\.pdf$`, 'i'))
      expect(response.body).not.to.have.property('file')
      expect(response.body.payload.document).not.to.have.property('buffer')

      const metadata = response.body.payload.document
      expect(metadata.uploadedAt).to.be.a('string')
      expect(Number.isNaN(Date.parse(metadata.uploadedAt))).to.equal(false)
      const relativeFilePath = metadata.relativePath.split('/').join(sep)
      const absoluteFilePath = resolve(process.env.UPLOADS_DIR, relativeFilePath)
      const fromRoot = relative(resolve(process.env.UPLOADS_DIR), absoluteFilePath)
      expect(fromRoot).not.to.equal('..')
      expect(fromRoot.startsWith(`..${sep}`)).to.equal(false)
      expect(await readFile(absoluteFilePath)).to.deep.equal(PDF)
      const persisted = await usersRepository.findById(user.id)
      expect(response.body.payload.document._id).to.equal(String(persisted.documents[0]._id))
      expect(persisted.documents[0]).to.include({
        originalName: 'identity.pdf',
        generatedName: metadata.generatedName,
        relativePath: metadata.relativePath,
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
        documentType: 'identity',
      })
      expect(persisted.documents[0]).not.to.have.property('buffer')

      const listing = await request(getTestApp()).get('/api/users').expect(200)
      const listedUser = listing.body.payload.items.find((entry) => entry._id === user.id)
      expect(listedUser).to.exist
      expect(listedUser).not.to.have.property('documents')
    })

    it('acepta PDF, JPEG y PNG con sus firmas correspondientes y tipos documentales válidos', async function () {
      const user = await createUserFixture()
      const cases = [
        ['identity.pdf', PDF, 'application/pdf', 'identity'],
        ['license.jpg', JPEG, 'image/jpeg', 'driver_license'],
        ['address.png', PNG, 'image/png', 'proof_of_address'],
      ]

      for (const [name, bytes, mimeType, documentType] of cases) {
        const response = await attachUserFile(user.id, name, bytes, mimeType, documentType).expect(201)
        expect(response.body.payload.document).to.include({ originalName: name, mimeType, documentType })
      }
      expect((await usersRepository.findById(user.id)).documents).to.have.lengthOf(3)
      expect(await allFiles()).to.have.lengthOf(3)
    })

    it('rechaza un archivo faltante con el envelope centralizado', async function () {
      const user = await createUserFixture()
      const response = await request(getTestApp())
        .post(`/api/users/${user.id}/documents`)
        .field('documentType', 'identity')

      expectErrorResponse(response, { status: 400, ...ERROR_CATALOG.FILE_REQUIRED })
      await expectNoFiles()

      const empty = await request(getTestApp()).post(`/api/users/${user.id}/documents`)
      expectErrorResponse(empty, { status: 400, ...ERROR_CATALOG.FILE_REQUIRED })
    })

    it('requiere documentType aunque el archivo sea válido', async function () {
      const user = await createUserFixture()
      const response = await request(getTestApp())
        .post(`/api/users/${user.id}/documents`)
        .attach('file', PDF, { filename: 'identity.pdf', contentType: 'application/pdf' })
      expectErrorResponse(response, { status: 400, ...ERROR_CATALOG.INVALID_DOCUMENT_TYPE })
      await expectNoFiles()
    })

    it('rechaza un tipo documental inválido y elimina el archivo temporal', async function () {
      const user = await createUserFixture()
      const response = await attachUserFile(user.id, 'identity.pdf', PDF, 'application/pdf', 'passport')

      expectErrorResponse(response, { status: 400, ...ERROR_CATALOG.INVALID_DOCUMENT_TYPE })
      expect((await usersRepository.findById(user.id)).documents).to.have.lengthOf(0)
      await expectNoFiles()
    })

    it('rechaza MIME no permitido y contenido cuya firma no coincide', async function () {
      const user = await createUserFixture()
      const invalidMime = await attachUserFile(user.id, 'page.html', Buffer.from('<script>bad</script>'), 'text/html')
      expectErrorResponse(invalidMime, { status: 415, ...ERROR_CATALOG.INVALID_FILE_TYPE })
      await expectNoFiles()

      const wrongSignature = await attachUserFile(user.id, 'identity.pdf', Buffer.from('<html>not a PDF</html>'))
      expectErrorResponse(wrongSignature, { status: 415, ...ERROR_CATALOG.INVALID_FILE_TYPE })
      await expectNoFiles()
    })

    it('rechaza extensión que no corresponde al MIME y sanea nombres recibidos', async function () {
      const user = await createUserFixture()
      const rejected = await attachUserFile(user.id, 'identity.html', PDF)
      expectErrorResponse(rejected, { status: 415, ...ERROR_CATALOG.INVALID_FILE_TYPE })
      await expectNoFiles()

      const accepted = await attachUserFile(user.id, '..\\private\\identity.pdf')
      expect(accepted.status).to.equal(201)
      expect(accepted.body.payload.document.originalName).to.equal('identity.pdf')
    })

    it('rechaza archivos mayores a 5 MiB sin dejar archivos parciales', async function () {
      const user = await createUserFixture()
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 0x61)
      oversized.write('%PDF-', 0, 'ascii')
      const response = await attachUserFile(user.id, 'large.pdf', oversized)

      expectErrorResponse(response, { status: 413, ...ERROR_CATALOG.FILE_TOO_LARGE })
      await expectNoFiles()
    })

    it('rechaza campos de archivo o texto inesperados', async function () {
      const user = await createUserFixture()
      const wrongFileField = await request(getTestApp())
        .post(`/api/users/${user.id}/documents`)
        .attach('attachment', PDF, { filename: 'identity.pdf', contentType: 'application/pdf' })
        .field('documentType', 'identity')
      expectErrorResponse(wrongFileField, { status: 400, ...ERROR_CATALOG.UNEXPECTED_FILE_FIELD })

      const wrongTextField = await request(getTestApp())
        .post(`/api/users/${user.id}/documents`)
        .attach('file', PDF, { filename: 'identity.pdf', contentType: 'application/pdf' })
        .field('documentType', 'identity')
        .field('extra', 'no permitido')
      expectErrorResponse(wrongTextField, { status: 400, ...ERROR_CATALOG.UNEXPECTED_FILE_FIELD })
      await expectNoFiles()
    })

    it('rechaza IDs malformados antes de escribir archivos', async function () {
      const response = await attachUserFile('not-an-object-id')
      expectErrorResponse(response, { status: 400, ...ERROR_CATALOG.INVALID_ID })
      await expectNoFiles()
    })

    it('no permite inyectar metadatos documentales mediante creación o listados generales', async function () {
      const forgedDocument = {
        originalName: 'forged.pdf',
        generatedName: 'forged.pdf',
        relativePath: '../../outside/forged.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
        documentType: 'identity',
        uploadedAt: new Date().toISOString(),
      }
      const created = await request(getTestApp())
        .post('/api/users')
        .send({
          name: 'Usuario de carga',
          email: 'upload-injection@example.test',
          documents: [forgedDocument],
        })
        .expect(201)

      expect(created.body.payload.documents).to.deep.equal([])
      expect((await usersRepository.findById(created.body.payload._id)).documents).to.have.lengthOf(0)

      const listing = await request(getTestApp()).get('/api/users').expect(200)
      const listedUser = listing.body.payload.items.find((entry) => entry._id === created.body.payload._id)
      expect(listedUser).to.exist
      expect(listedUser).not.to.have.property('documents')
    })

    it('rechaza usuarios inexistentes y elimina el archivo almacenado por Multer', async function () {
      const response = await attachUserFile(nonexistentId())
      expectErrorResponse(response, { status: 404, ...ERROR_CATALOG.USER_NOT_FOUND })
      await expectNoFiles()
    })

    it('normaliza un fallo de almacenamiento sin filtrar rutas físicas', async function () {
      const user = await createUserFixture()
      const userDirectoryBlocker = join(process.env.UPLOADS_DIR, 'users', user.id)
      await mkdir(join(process.env.UPLOADS_DIR, 'users'), { recursive: true })
      await writeFile(userDirectoryBlocker, 'synthetic blocker')
      try {
        const response = await attachUserFile(user.id)
        expectErrorResponse(response, { status: 500, ...ERROR_CATALOG.FILE_STORAGE_FAILED })
        expect(JSON.stringify(response.body)).not.to.include(process.env.UPLOADS_DIR)
      } finally {
        await rm(userDirectoryBlocker, { force: true })
      }
      await expectNoFiles()
    })

    it('compensa un fallo de persistencia de metadatos sin borrar documentos previos', async function () {
      const user = await createUserFixture()
      const firstUpload = await attachUserFile(user.id, 'existing.pdf').expect(201)
      const existingMetadata = firstUpload.body.payload.document
      const existingPath = resolve(process.env.UPLOADS_DIR, existingMetadata.relativePath)
      const originalAddDocument = usersRepository.addDocument
      try {
        usersRepository.addDocument = async () => { throw new Error('synthetic persistence failure') }
        const response = await attachUserFile(user.id)
        expectErrorResponse(response, { status: 500, ...ERROR_CATALOG.FILE_METADATA_SAVE_FAILED })
      } finally {
        usersRepository.addDocument = originalAddDocument
      }

      const persisted = await usersRepository.findById(user.id)
      expect(persisted.documents).to.have.lengthOf(1)
      expect(persisted.documents[0].generatedName).to.equal(existingMetadata.generatedName)
      expect(await readFile(existingPath)).to.deep.equal(PDF)
      expect(await allFiles()).to.have.lengthOf(1)
    })
  })

  describe('POST /api/deliveries/:deliveryId/proof', function () {
    it('guarda comprobantes en Delivery y devuelve la entidad actualizada', async function () {
      const delivery = await createDeliveryFixture()
      const response = await attachProof(delivery.id).expect(201)

      expect(response.body.status).to.equal('success')
      expect(response.body.payload.delivery._id).to.equal(delivery.id)
      expect(response.body.payload.delivery).not.to.have.property('proofs')
      expect(response.body.payload.proof).to.include({
        originalName: 'proof.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
      })
      expect(response.body.payload.proof).not.to.have.property('documentType')
      expect(response.body.payload.proof).not.to.have.property('buffer')
      const persisted = await DeliveryModel.findById(delivery.id).lean()
      expect(response.body.payload.proof._id).to.equal(String(persisted.proofs[0]._id))
      expect(persisted.proofs[0]).to.include({
        generatedName: response.body.payload.proof.generatedName,
        relativePath: response.body.payload.proof.relativePath,
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
      })
      const filePath = resolve(process.env.UPLOADS_DIR, persisted.proofs[0].relativePath)
      expect(await readFile(filePath)).to.deep.equal(PDF)
      expect(persisted.proofs[0].relativePath).to.match(new RegExp(`^deliveries/${delivery.id}/[\\da-f-]{36}\\.pdf$`, 'i'))
    })

    it('permite agregar más de un comprobante a la misma entrega', async function () {
      const delivery = await createDeliveryFixture()
      await attachProof(delivery.id, 'first.pdf').expect(201)
      await attachProof(delivery.id, 'second.png', PNG, 'image/png').expect(201)

      const persisted = await DeliveryModel.findById(delivery.id).lean()
      expect(persisted.proofs).to.have.lengthOf(2)
      expect(await allFiles()).to.have.lengthOf(2)
    })

    it('rechaza un archivo faltante y una entrega inexistente', async function () {
      const delivery = await createDeliveryFixture()
      const missing = await request(getTestApp()).post(`/api/deliveries/${delivery.id}/proof`)
      expectErrorResponse(missing, { status: 400, ...ERROR_CATALOG.FILE_REQUIRED })

      const absent = await attachProof(nonexistentId())
      expectErrorResponse(absent, { status: 404, ...ERROR_CATALOG.DELIVERY_NOT_FOUND })
      await expectNoFiles()
    })

    it('rechaza MIME no permitido, campo multipart incorrecto y firma discordante', async function () {
      const delivery = await createDeliveryFixture()
      const invalidMime = await attachProof(delivery.id, 'proof.svg', Buffer.from('<svg/>'), 'image/svg+xml')
      expectErrorResponse(invalidMime, { status: 415, ...ERROR_CATALOG.INVALID_FILE_TYPE })

      const wrongField = await request(getTestApp())
        .post(`/api/deliveries/${delivery.id}/proof`)
        .attach('receipt', PDF, { filename: 'proof.pdf', contentType: 'application/pdf' })
      expectErrorResponse(wrongField, { status: 400, ...ERROR_CATALOG.UNEXPECTED_FILE_FIELD })

      const mismatch = await attachProof(delivery.id, 'proof.pdf', Buffer.from('<html/>'))
      expectErrorResponse(mismatch, { status: 415, ...ERROR_CATALOG.INVALID_FILE_TYPE })
      await expectNoFiles()
    })

    it('rechaza IDs malformados y archivos mayores a 10 MiB', async function () {
      const malformed = await attachProof('not-an-object-id')
      expectErrorResponse(malformed, { status: 400, ...ERROR_CATALOG.INVALID_ID })
      await expectNoFiles()

      const delivery = await createDeliveryFixture()
      const oversized = Buffer.alloc(10 * 1024 * 1024 + 1, 0x61)
      oversized.write('%PDF-', 0, 'ascii')
      const response = await attachProof(delivery.id, 'large.pdf', oversized)
      expectErrorResponse(response, { status: 413, ...ERROR_CATALOG.FILE_TOO_LARGE })
      await expectNoFiles()
    })

    it('compensa un fallo al guardar metadatos', async function () {
      const delivery = await createDeliveryFixture()
      const existingUpload = await attachProof(delivery.id, 'existing.pdf').expect(201)
      const existingFilePath = resolve(process.env.UPLOADS_DIR, existingUpload.body.payload.proof.relativePath)
      const originalAddProof = deliveriesRepository.addProof
      try {
        deliveriesRepository.addProof = async () => { throw new Error('synthetic persistence failure') }
        const response = await attachProof(delivery.id)
        expectErrorResponse(response, { status: 500, ...ERROR_CATALOG.FILE_METADATA_SAVE_FAILED })
      } finally {
        deliveriesRepository.addProof = originalAddProof
      }

      const persisted = await DeliveryModel.findById(delivery.id).lean()
      expect(persisted.proofs).to.have.lengthOf(1)
      expect(persisted.proofs[0].generatedName).to.equal(existingUpload.body.payload.proof.generatedName)
      expect(await readFile(existingFilePath)).to.deep.equal(PDF)
      expect(await allFiles()).to.have.lengthOf(1)
    })

    it('no permite inyectar comprobantes mediante la creación directa de una entrega', async function () {
      const order = await createOrderFixture()
      const driver = await createUserFixture({ role: USER_ROLES.DRIVER })
      const forgedProof = {
        originalName: 'forged.pdf',
        generatedName: 'forged.pdf',
        relativePath: '../../outside/forged.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
        uploadedAt: new Date().toISOString(),
      }
      const response = await request(getTestApp())
        .post('/api/deliveries')
        .send({ orderId: String(order._id), driverId: String(driver._id), proofs: [forgedProof] })
        .expect(201)

      expect(response.body.payload.proofs).to.deep.equal([])
      expect((await DeliveryModel.findById(response.body.payload._id).lean()).proofs).to.have.lengthOf(0)
    })
  })

  it('publica ambos contratos multipart en OpenAPI', function () {
    const userUpload = swaggerSpec.paths['/api/users/{userId}/documents'].post
    const proofUpload = swaggerSpec.paths['/api/deliveries/{deliveryId}/proof'].post
    const userSchema = userUpload.requestBody.content['multipart/form-data'].schema
    const proofSchema = proofUpload.requestBody.content['multipart/form-data'].schema

    expect(userUpload.parameters[0]).to.include({ name: 'userId', in: 'path', required: true })
    expect(userSchema.required).to.deep.equal(['file', 'documentType'])
    expect(userSchema.properties.file).to.include({ type: 'string', format: 'binary' })
    expect(userSchema.properties.documentType.enum).to.deep.equal(['identity', 'driver_license', 'proof_of_address'])
    expect(userUpload.responses['201'].content['application/json'].schema.allOf[1]
      .properties.payload.properties.document.$ref).to.equal('#/components/schemas/UserDocumentMetadata')
    expect(swaggerSpec.components.schemas.UserDocumentMetadata.required).to.include('_id')
    expect(swaggerSpec.components.schemas.UserDocumentMetadata.required).to.include('documentType')
    expect(proofUpload.parameters[0]).to.include({ name: 'deliveryId', in: 'path', required: true })
    expect(proofSchema.required).to.deep.equal(['file'])
    expect(proofSchema.properties.file).to.include({ type: 'string', format: 'binary' })
    expect(proofUpload.responses['201'].content['application/json'].schema.allOf[1]
      .properties.payload.properties.proof.$ref).to.equal('#/components/schemas/DeliveryProofMetadata')
    expect(swaggerSpec.components.schemas.DeliveryProofMetadata.required).to.include('_id')
    expect(swaggerSpec.components.schemas.DeliveryProofMetadata.required).not.to.include('documentType')
  })
})
