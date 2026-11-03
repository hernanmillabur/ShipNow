import { deliveriesRepository } from '../repositories/deliveries.repository.js'
import { ordersRepository } from '../repositories/orders.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { USER_ROLES } from '../constants/index.js'

const notFound = (code) => Object.assign(new Error(code), { status: 404 })
const badRequest = (code) => Object.assign(new Error(code), { status: 400 })

export const deliveriesService = {
  create: async (data) => {
    const order = await ordersRepository.findById(data.orderId)
    if (!order) throw notFound('ORDER_NOT_FOUND')

    const driver = await usersRepository.findById(data.driverId)
    if (!driver) throw notFound('DRIVER_NOT_FOUND')
    if (driver.role !== USER_ROLES.DRIVER) throw badRequest('USER_IS_NOT_A_DRIVER')

    return deliveriesRepository.create(data)
  },
}
