import { ordersRepository } from '../repositories/orders.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { storesRepository } from '../repositories/stores.repository.js'
import { ORDER_STATUS } from '../constants/index.js'
import {
  InvalidStateError,
  OrderNotFoundError,
  StoreNotFoundError,
  UserNotFoundError,
} from '../errors/domain-error.js'

// Provisorio hasta el Módulo 3 (custom errors + middleware global)

export const ordersService = {
  createOrder: async (data) => {
    const user = await usersRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const store = await storesRepository.findById(data.storeId)
    if (!store) throw new StoreNotFoundError()

    const total = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return ordersRepository.create({ ...data, total, status: ORDER_STATUS.PENDING })
  },

  getOrders: () => ordersRepository.findAll(),

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
