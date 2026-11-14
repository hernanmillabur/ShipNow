import multer from 'multer'
import { DomainError } from '../errors/domain-error.js'
import { deliveryProofUpload, userDocumentUpload } from '../config/multer.config.js'
import { removeUploadedFile } from '../services/uploads.service.js'

const mapMulterError = (error) => {
  if (error instanceof DomainError) return error
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return new DomainError('FILE_TOO_LARGE')
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return new DomainError('UNEXPECTED_FILE_FIELD')
    if (error.code.startsWith('LIMIT_')) return new DomainError('UNEXPECTED_FILE_FIELD')
  }
  return new DomainError('FILE_STORAGE_FAILED')
}

const createUploadMiddleware = ({ parser, allowedFields, idParam }) => (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params[idParam] ?? '')) {
    return next(new DomainError('INVALID_ID'))
  }

  parser.single('file')(req, res, async (error) => {
    if (error) return next(mapMulterError(error))
    const unexpected = Object.keys(req.body ?? {}).some((field) => !allowedFields.includes(field))
    if (unexpected) {
      const domainError = new DomainError('UNEXPECTED_FILE_FIELD')
      await removeUploadedFile(req.file, domainError, { entityId: req.params[idParam] })
      return next(domainError)
    }
    return next()
  })
}

export const uploadUserDocument = createUploadMiddleware({
  parser: userDocumentUpload,
  allowedFields: ['documentType'],
  idParam: 'userId',
})

export const uploadDeliveryProof = createUploadMiddleware({
  parser: deliveryProofUpload,
  allowedFields: [],
  idParam: 'deliveryId',
})
