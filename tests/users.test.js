import { expect } from 'chai'
import request from 'supertest'
import { USER_ROLES } from '../src/constants/index.js'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import StoreModel from '../src/models/store.model.js'
import { getTestApp } from './helpers/test-context.js'
import { expectErrorResponse } from './helpers/fixtures.js'

describe('Users API', function () {
  it('GET /api/users devuelve el listado controlado con propiedades de usuario', async function () {
    const app = getTestApp()
    const created = await request(app)
      .post('/api/users')
      .send({ name: 'Ana de prueba', email: 'ana-users@example.test' })
      .expect(201)

    expect(created.body).to.have.property('status', 'success')
    expect(created.body.payload).to.include({
      name: 'Ana de prueba',
      email: 'ana-users@example.test',
      role: USER_ROLES.CUSTOMER,
    })
    expect(created.body.payload._id).to.match(/^[a-f\d]{24}$/i)

    const response = await request(app).get('/api/users').expect(200)

    expect(response.body).to.have.property('status', 'success')
    expect(response.body.payload).to.be.an('array').with.lengthOf(1)
    expect(response.body.payload[0]).to.include({
      _id: created.body.payload._id,
      name: 'Ana de prueba',
      email: 'ana-users@example.test',
      role: USER_ROLES.CUSTOMER,
    })
  })

  it('POST /api/users normaliza un email duplicado como conflicto', async function () {
    const app = getTestApp()
    const userData = { name: 'Usuario duplicado', email: 'duplicado-users@example.test' }

    await request(app).post('/api/users').send(userData).expect(201)
    const response = await request(app).post('/api/users').send(userData)

    expectErrorResponse(response, {
      status: 409,
      code: 'DUPLICATE_RESOURCE',
      message: ERROR_CATALOG.DUPLICATE_RESOURCE.message,
    })
  })

  it('POST /api/users/stores crea una tienda y la persiste', async function () {
    const response = await request(getTestApp())
      .post('/api/users/stores')
      .send({ name: 'Tienda funcional', address: 'Avenida de prueba 100' })
      .expect(201)

    expect(response.body).to.have.property('status', 'success')
    expect(response.body.payload).to.include({
      name: 'Tienda funcional',
      address: 'Avenida de prueba 100',
    })
    expect(response.body.payload._id).to.match(/^[a-f\d]{24}$/i)
    expect(await StoreModel.findById(response.body.payload._id)).to.exist
  })

  it('POST /api/users/stores rechaza el nombre requerido ausente', async function () {
    const response = await request(getTestApp())
      .post('/api/users/stores')
      .send({ address: 'Avenida de prueba 100' })

    expectErrorResponse(response, {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: ERROR_CATALOG.VALIDATION_ERROR.message,
    })
  })
})
