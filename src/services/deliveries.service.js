import { deliveriesRepository } from '../repositories/deliveries.repository.js'
import { ordersRepository } from '../repositories/orders.repository.js'
import { usersRepository } from '../repositories/users.repository.js'
import { USER_ROLES } from '../constants/index.js'
import {
  DomainError,
  DriverNotFoundError,
  InvalidDriverRoleError,
  OrderNotFoundError,
} from '../errors/domain-error.js'


export const deliveriesService = {
  create: async (data) => {
    if (
      !data
      || typeof data !== 'object'
      || Array.isArray(data)
      || !data.orderId
      || !data.driverId
    ) {
      throw new DomainError('VALIDATION_ERROR')
    }

    const order = await ordersRepository.findById(data.orderId)
    if (!order) throw new OrderNotFoundError()

    const driver = await usersRepository.findById(data.driverId)
    if (!driver) throw new DriverNotFoundError()
    if (driver.role !== USER_ROLES.DRIVER) throw new InvalidDriverRoleError()

    const deliveryData = {
      orderId: data.orderId,
      driverId: data.driverId,
      ...(['status', 'assignedAt', 'deliveredAt'].reduce((allowed, field) => {
        if (Object.hasOwn(data, field)) allowed[field] = data[field]
        return allowed
      }, {})),
    }
    return deliveriesRepository.create(deliveryData)
  },
}
