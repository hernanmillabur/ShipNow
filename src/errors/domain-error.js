import { ERROR_CATALOG } from './error-catalog.js'

export class DomainError extends Error {
  constructor(code, { cause } = {}) {
    const definition = ERROR_CATALOG[code] ?? ERROR_CATALOG.INTERNAL_ERROR
    super(definition.message)
    this.name = this.constructor.name
    this.code = definition.code
    this.status = definition.status
    if (cause !== undefined) this.cause = cause
  }
}

export class UserNotFoundError extends DomainError {
  constructor() { super('USER_NOT_FOUND') }
}

export class StoreNotFoundError extends DomainError {
  constructor() { super('STORE_NOT_FOUND') }
}

export class OrderNotFoundError extends DomainError {
  constructor() { super('ORDER_NOT_FOUND') }
}

export class ProductNotFoundError extends DomainError {
  constructor() { super('PRODUCT_NOT_FOUND') }
}

export class DriverNotFoundError extends DomainError {
  constructor() { super('DRIVER_NOT_FOUND') }
}

export class InvalidDriverRoleError extends DomainError {
  constructor() { super('INVALID_DRIVER_ROLE') }
}

export class InvalidStateError extends DomainError {
  constructor() { super('INVALID_STATE') }
}

export class InvalidMockQuantityError extends DomainError {
  constructor() { super('INVALID_MOCK_QUANTITY') }
}

export class InvalidProductDataError extends DomainError {
  constructor(code = 'INVALID_PRODUCT_DATA') { super(code) }
}

export class MockSeedFailedError extends DomainError {
  constructor(cause) { super('MOCK_SEED_FAILED', { cause }) }
}
