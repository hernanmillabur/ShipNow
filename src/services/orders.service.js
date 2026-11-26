import { ordersRepository } from '../repositories/orders.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { storesRepository } from '../repositories/stores.repository.js'
import { ORDER_STATUS } from '../constants/index.js'
import { paginationMetadata, parseOrderListQuery } from '../utils/pagination.js'
import {
  DomainError,
  InvalidStateError,
  OrderNotFoundError,
  StoreNotFoundError,
  UserNotFoundError,
} from '../errors/domain-error.js'

// Provisorio hasta el Módulo 3 (custom errors + middleware global)

export const ordersService = {
  createOrder: async (data) => {
    const hasRequiredFields = data
      && typeof data === 'object'
      && !Array.isArray(data)
      && data.userId
      && data.storeId
      && typeof data.address === 'string'
      && data.address.length > 0
    const hasValidItems = Array.isArray(data?.items)
      && data.items.length > 0
      && data.items.every((item) => (
        item
        && typeof item === 'object'
        && !Array.isArray(item)
        && typeof item.price === 'number'
        && Number.isFinite(item.price)
        && typeof item.quantity === 'number'
        && Number.isFinite(item.quantity)
        && (item.name === undefined || typeof item.name === 'string')
      ))

    if (!hasRequiredFields || !hasValidItems) {
      throw new DomainError('VALIDATION_ERROR')
    }

    const user = await usersRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const store = await storesRepository.findById(data.storeId)
    if (!store) throw new StoreNotFoundError()

    const total = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return ordersRepository.create({ ...data, total, status: ORDER_STATUS.PENDING })
  },

  getOrders: async (query = {}) => {
    const pageQuery = parseOrderListQuery(query)
    const { items, totalItems } = await ordersRepository.findPage(pageQuery)
    return { items, pagination: paginationMetadata({ ...pageQuery, totalItems }) }
  },

  getOrderById: async (id) => {
    const order = await ordersRepository.findById(id)
    if (!order) throw new OrderNotFoundError()
    return order
  },

  deliverOrder: async (id) => {
    const order = await ordersRepository.findById(id)
    if (!order) throw new OrderNotFoundError()
    if (order.status === ORDER_STATUS.DELIVERED) throw new InvalidStateError()
    return ordersRepository.updateStatus(id, ORDER_STATUS.DELIVERED)
  },
}
