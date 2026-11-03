import { ordersRepository } from '../repositories/orders.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { storesRepository } from '../repositories/stores.repository.js'
import { ORDER_STATUS } from '../constants/index.js'

// Provisorio hasta el Módulo 3 (custom errors + middleware global)
const notFound = (code) => Object.assign(new Error(code), { status: 404 })
const badRequest = (code) => Object.assign(new Error(code), { status: 400 })

export const ordersService = {
  createOrder: async (data) => {
    const user = await usersRepository.findById(data.userId)
    if (!user) throw notFound('USER_NOT_FOUND')

    const store = await storesRepository.findById(data.storeId)
    if (!store) throw notFound('STORE_NOT_FOUND')

    const total = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return ordersRepository.create({ ...data, total, status: ORDER_STATUS.PENDING })
  },

  getOrders: () => ordersRepository.findAll(),

  getOrderById: async (id) => {
    const order = await ordersRepository.findById(id)
    if (!order) throw notFound('ORDER_NOT_FOUND')
    return order
  },

  deliverOrder: async (id) => {
    const order = await ordersRepository.findById(id)
    if (!order) throw notFound('ORDER_NOT_FOUND')
    if (order.status === ORDER_STATUS.DELIVERED) throw badRequest('ORDER_ALREADY_DELIVERED')
    return ordersRepository.updateStatus(id, ORDER_STATUS.DELIVERED)
  },
}
