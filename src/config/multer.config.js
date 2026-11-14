import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { mkdir, realpath } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DomainError } from '../errors/domain-error.js'
import { config } from './env.config.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const uploadsRoot = resolve(config.uploadsDir || resolve(projectRoot, 'uploads'))

export const MAX_USER_DOCUMENT_BYTES = 5 * 1024 * 1024
export const MAX_DELIVERY_PROOF_BYTES = 10 * 1024 * 1024

export const acceptedFileTypes = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
})

const resolveWithinRoot = (target) => {
  const resolved = resolve(target)
  const relativePath = relative(uploadsRoot, resolved)
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error('Upload path escaped the configured root')
  }
  return resolved
}

const createStorage = (category, idParam) => multer.diskStorage({
  destination: (req, _file, callback) => {
    const entityId = req.params[idParam]
    let directory
    try {
      directory = resolveWithinRoot(resolve(uploadsRoot, category, entityId))
    } catch {
      callback(new DomainError('FILE_STORAGE_FAILED'))
      return
    }
    mkdir(directory, { recursive: true })
      .then(async () => {
        const actualRoot = await realpath(uploadsRoot)
        const actualDirectory = await realpath(directory)
        const actualRelative = relative(actualRoot, actualDirectory)
        if (!actualRelative || actualRelative === '..' || actualRelative.startsWith(`..${sep}`) || isAbsolute(actualRelative)) {
          throw new Error('Upload directory resolved outside the configured root')
        }
        callback(null, directory)
      })
      .catch(() => callback(new DomainError('FILE_STORAGE_FAILED')))
  },
  filename: (_req, file, callback) => {
    const extension = acceptedFileTypes[file.mimetype]
    if (!extension) return callback(new DomainError('INVALID_FILE_TYPE'))
    return callback(null, `${randomUUID()}${extension}`)
  },
})

const createMulter = ({ category, idParam, maxBytes }) => multer({
  storage: createStorage(category, idParam),
  limits: {
    fileSize: maxBytes,
    files: 1,
    fields: category === 'users' ? 1 : 0,
    parts: category === 'users' ? 2 : 1,
    fieldNameSize: 32,
    fieldSize: 128,
  },
  fileFilter: (_req, file, callback) => {
    if (!Object.hasOwn(acceptedFileTypes, file.mimetype)) {
      return callback(new DomainError('INVALID_FILE_TYPE'))
    }
    return callback(null, true)
  },
})

export const userDocumentUpload = createMulter({
  category: 'users', idParam: 'userId', maxBytes: MAX_USER_DOCUMENT_BYTES,
})
export const deliveryProofUpload = createMulter({
  category: 'deliveries', idParam: 'deliveryId', maxBytes: MAX_DELIVERY_PROOF_BYTES,
})

export const relativeUploadPath = (filePath) => {
  const path = relative(uploadsRoot, resolve(filePath))
  if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new DomainError('FILE_STORAGE_FAILED')
  }
  return path.split(sep).join('/')
}

export const uploadExtension = (mimeType) => acceptedFileTypes[mimeType]
export const uploadExtensionFromName = (name) => extname(name).toLowerCase()
