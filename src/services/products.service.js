import { productsRepository } from '../repositories/products.repository.js'
import { PRODUCT_STATUS } from '../constants/index.js'

const notFound = () => Object.assign(new Error('PRODUCT_NOT_FOUND'), { status: 404 })
const badRequest = (message) => Object.assign(new Error(message), { status: 400 })
const statusForStock = (stock) => stock === 0
  ? PRODUCT_STATUS.OUT_OF_STOCK
  : PRODUCT_STATUS.AVAILABLE

const validateProduct = (data, { partial = false } = {}) => {
  const allowed = new Set(['name', 'description', 'price', 'stock'])
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) throw badRequest(`INVALID_PRODUCT_FIELD:${key}`)
  }
  if (!partial || 'name' in data) {
    if (typeof data.name !== 'string' || !data.name.trim()) throw badRequest('INVALID_PRODUCT_NAME')
  }
  if (!partial || 'price' in data) {
    if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0) {
      throw badRequest('INVALID_PRODUCT_PRICE')
    }
  }
  if (!partial || 'stock' in data) {
    if (!Number.isInteger(data.stock) || data.stock < 0) throw badRequest('INVALID_PRODUCT_STOCK')
  }
  if ('description' in data && typeof data.description !== 'string') {
    throw badRequest('INVALID_PRODUCT_DESCRIPTION')
  }
}

export const productsService = {
  getAll: () => productsRepository.getAll(),
  getById: async (id) => {
    const product = await productsRepository.getById(id)
    if (!product) throw notFound()
    return product
  },
  create: (data) => {
    validateProduct(data)
    return productsRepository.create({
      ...data,
      name: data.name.trim(),
      status: statusForStock(data.stock),
    })
  },
  update: async (id, data) => {
    validateProduct(data, { partial: true })
    const current = await productsRepository.getById(id)
    if (!current) throw notFound()
    const updated = await productsRepository.update(id, {
      ...data,
      ...(data.name ? { name: data.name.trim() } : {}),
      status: statusForStock(data.stock ?? current.stock),
    })
    if (!updated) throw notFound()
    return updated
  },
  delete: async (id) => {
    const product = await productsRepository.delete(id)
    if (!product) throw notFound()
    return product
  },
}
