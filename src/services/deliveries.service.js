import { deliveriesRepository } from '../repositories/deliveries.repository.js'
import { ordersRepository } from '../repositories/orders.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { USER_ROLES } from '../constants/index.js'
import {
  DriverNotFoundError,
  InvalidDriverRoleError,
  OrderNotFoundError,
} from '../errors/domain-error.js'


export const deliveriesService = {
  create: async (data) => {
    const order = await ordersRepository.findById(data.orderId)
    if (!order) throw new OrderNotFoundError()

    const driver = await usersRepository.findById(data.driverId)
    if (!driver) throw new DriverNotFoundError()
    if (driver.role !== USER_ROLES.DRIVER) throw new InvalidDriverRoleError()

    return deliveriesRepository.create(data)
  },
}
