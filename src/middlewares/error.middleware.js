import { ERROR_CATALOG } from '../errors/error-catalog.js'
import { DomainError } from '../errors/domain-error.js'

const getErrorDefinition = (error) => {
  if (error instanceof DomainError) {
    return ERROR_CATALOG[error.code] ?? ERROR_CATALOG.INTERNAL_ERROR
  }
  if (error?.name === 'CastError') return ERROR_CATALOG.INVALID_ID
  if (error?.name === 'ValidationError') return ERROR_CATALOG.VALIDATION_ERROR
  if (error?.code === 11000) return ERROR_CATALOG.DUPLICATE_RESOURCE
  if (error?.type === 'entity.parse.failed' || error?.status === 400) {
    return ERROR_CATALOG.INVALID_REQUEST
  }
  return ERROR_CATALOG.INTERNAL_ERROR
}

export const errorMiddleware = (error, req, res, next) => {
  const definition = getErrorDefinition(error)

  if (definition.code === 'MOCK_SEED_FAILED') {
    console.error('Mock seed failed:', error.cause ?? error)
  } else if (definition.code === 'INTERNAL_ERROR') {
    console.error(error)
  }

  res.status(definition.status).json({
    status: 'error',
    error: {
      code: definition.code,
      message: definition.message,
    },
  })
}
