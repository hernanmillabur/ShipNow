import mongoose from 'mongoose'
import { ORDER_PRIORITY, ORDER_STATUS, PRODUCT_STATUS, USER_ROLES } from '../constants/index.js'
import { DomainError } from '../errors/domain-error.js'

export const PAGE_LIMIT_DEFAULT = 20
export const PAGE_LIMIT_MAX = 100
const MAX_SKIP = 2_147_483_647

const invalid = () => new DomainError('INVALID_REQUEST')

const readPositiveInteger = (value, fallback) => {
  if (value === undefined) return fallback
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw invalid()
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw invalid()
  return parsed
}

const enumFilter = (query, key, values) => {
  const value = query[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !values.includes(value)) throw invalid()
  return value
}

const idFilter = (query, key) => {
  const value = query[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value) || !mongoose.isValidObjectId(value)) {
    throw new DomainError('INVALID_ID')
  }
  return new mongoose.Types.ObjectId(value)
}

export const parseListQuery = (query, allowedFilters = {}) => {
  const allowed = new Set(['page', 'limit', ...Object.keys(allowedFilters)])
  if (Object.keys(query).some((key) => !allowed.has(key))) throw invalid()
  const page = readPositiveInteger(query.page, 1)
  const limit = readPositiveInteger(query.limit, PAGE_LIMIT_DEFAULT)
  if (limit > PAGE_LIMIT_MAX || (page - 1) * limit > MAX_SKIP) throw invalid()
  const filter = {}
  for (const [key, validator] of Object.entries(allowedFilters)) {
    const value = validator(query, key)
    if (value !== undefined) filter[key] = value
  }
  return { page, limit, skip: (page - 1) * limit, filter }
}

export const parseOrderListQuery = (query) => parseListQuery(query, {
  status: (source, key) => enumFilter(source, key, Object.values(ORDER_STATUS)),
  priority: (source, key) => enumFilter(source, key, Object.values(ORDER_PRIORITY)),
  userId: idFilter,
  storeId: idFilter,
})

export const parseUserListQuery = (query) => parseListQuery(query, {
  role: (source, key) => enumFilter(source, key, Object.values(USER_ROLES)),
})

export const parseProductListQuery = (query) => parseListQuery(query, {
  status: (source, key) => enumFilter(source, key, Object.values(PRODUCT_STATUS)),
})

export const paginationMetadata = ({ page, limit, totalItems }) => {
  const totalPages = Math.ceil(totalItems / limit)
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: totalItems > 0 && page > 1,
  }
}
