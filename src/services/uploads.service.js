import { open, rm } from 'node:fs/promises'
import { win32 } from 'node:path'
import { logger } from '../logging/logger.js'
import { DomainError, DeliveryNotFoundError, UserNotFoundError } from '../errors/domain-error.js'
import { DOCUMENT_TYPES } from '../models/schemas/document-metadata.schema.js'
import { deliveriesRepository } from '../repositories/deliveries.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import {
  MAX_DELIVERY_PROOF_BYTES,
  MAX_USER_DOCUMENT_BYTES,
  relativeUploadPath,
  uploadExtension,
  uploadExtensionFromName,
} from '../config/multer.config.js'

const signatures = Object.freeze({
  'application/pdf': (bytes) => bytes.subarray(0, 5).equals(Buffer.from('%PDF-')),
  'image/jpeg': (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
})

const sanitizeOriginalName = (name) => {
  const winLeaf = win32.basename(String(name ?? ''))
  const safe = winLeaf
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .trim()
    .slice(0, 255)
  return safe || 'upload'
}

export const removeUploadedFile = async (file, originalError, { entityId } = {}) => {
  if (!file?.path) return
  try {
    await rm(file.path, { force: true })
  } catch (cleanupError) {
    logger.error('Upload compensation failed', {
      event: 'upload.cleanup.failed',
      entityId,
      errorName: cleanupError?.name,
      errorCode: cleanupError?.code,
      originalErrorName: originalError?.name,
      originalErrorCode: originalError?.code,
    })
  }
}

const validateFileContent = async (file, maxBytes) => {
  if (!file) throw new DomainError('FILE_REQUIRED')
  if (file.size > maxBytes) throw new DomainError('FILE_TOO_LARGE')
  const extension = uploadExtension(file.mimetype)
  const signatureMatches = signatures[file.mimetype]
  if (!extension || !signatureMatches || uploadExtensionFromName(file.originalname) !== extension) {
    throw new DomainError('INVALID_FILE_TYPE')
  }

  let handle
  try {
    handle = await open(file.path, 'r')
  } catch {
    throw new DomainError('FILE_STORAGE_FAILED')
  }
  try {
    const bytes = Buffer.alloc(8)
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0)
    if (!signatureMatches(bytes.subarray(0, bytesRead))) throw new DomainError('INVALID_FILE_TYPE')
  } catch (error) {
    if (error instanceof DomainError) throw error
    throw new DomainError('FILE_STORAGE_FAILED')
  } finally {
    try {
      await handle.close()
    } catch {
      throw new DomainError('FILE_STORAGE_FAILED')
    }
  }
}

const metadataFor = (file, documentType) => ({
  originalName: sanitizeOriginalName(file.originalname),
  generatedName: file.filename,
  relativePath: relativeUploadPath(file.path),
  mimeType: file.mimetype,
  sizeBytes: file.size,
  ...(documentType ? { documentType } : {}),
  uploadedAt: new Date(),
})

const attach = async ({ file, entityId, documentType, category }) => {
  const maxBytes = category === 'users' ? MAX_USER_DOCUMENT_BYTES : MAX_DELIVERY_PROOF_BYTES
  try {
    if (!file) throw new DomainError('FILE_REQUIRED')
    if (category === 'users' && !DOCUMENT_TYPES.includes(documentType)) {
      throw new DomainError('INVALID_DOCUMENT_TYPE')
    }
    await validateFileContent(file, maxBytes)

    const repository = category === 'users' ? usersRepository : deliveriesRepository
    let existing
    try {
      existing = await repository.findById(entityId)
    } catch {
      throw new DomainError('INTERNAL_ERROR')
    }
    if (!existing) {
      if (category === 'users') throw new UserNotFoundError()
      throw new DeliveryNotFoundError()
    }

    const metadata = metadataFor(file, documentType)
    let updated
    try {
      updated = category === 'users'
        ? await usersRepository.addDocument(entityId, metadata)
        : await deliveriesRepository.addProof(entityId, metadata)
    } catch {
      throw new DomainError('FILE_METADATA_SAVE_FAILED')
    }
    if (!updated) {
      if (category === 'users') throw new UserNotFoundError()
      throw new DeliveryNotFoundError()
    }

    const persistedCollection = category === 'users' ? updated.documents : updated.proofs
    const persistedMetadata = persistedCollection?.find(
      (entry) => entry.relativePath === metadata.relativePath,
    )

    logger.info('Upload metadata persisted', {
      event: category === 'users' ? 'upload.user_document.success' : 'upload.delivery_proof.success',
      entityId,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
    })
    return { entity: updated, document: persistedMetadata ?? metadata }
  } catch (error) {
    await removeUploadedFile(file, error, { entityId })
    if (error instanceof DomainError) throw error
    if (error?.code === 'ENOENT') throw new DomainError('FILE_STORAGE_FAILED')
    throw new DomainError('FILE_METADATA_SAVE_FAILED')
  }
}

export const uploadsService = {
  attachUserDocument: (userId, file, documentType) => attach({
    entityId: userId, file, documentType, category: 'users',
  }),
  attachDeliveryProof: (deliveryId, file) => attach({
    entityId: deliveryId, file, category: 'deliveries',
  }),
}
