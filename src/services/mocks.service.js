import { randomUUID } from 'node:crypto'
import { DELIVERY_STATUS, ORDER_PRIORITY, ORDER_STATUS, USER_ROLES } from '../constants/index.js'
import { deliveriesService } from './deliveries.service.js'
import { ordersService } from './orders.service.js'
import { usersService } from './users.service.js'
import { InvalidMockQuantityError, MockSeedFailedError } from '../errors/domain-error.js'
import { logger, safeErrorMetadata } from '../logging/logger.js'

const DEFAULT_QTY = Object.freeze({ users: 2, orders: 5, deliveries: 5, seed: 10 })
const MAX_QTY = 100

const quantity = (value, endpoint, acceptNumber = false) => {
  const raw = value === undefined ? String(DEFAULT_QTY[endpoint]) : value
  if (acceptNumber && typeof raw === 'number') {
    if (!Number.isSafeInteger(raw) || raw < 1 || raw > MAX_QTY) {
      throw new InvalidMockQuantityError()
    }
    return raw
  }
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    throw new InvalidMockQuantityError()
  }
  const qty = Number(raw)
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > MAX_QTY) {
    throw new InvalidMockQuantityError()
  }
  return qty
}

const mockId = (type) => `mock-${type}-${randomUUID()}`

const createMockUsers = (qty) => ({
  customers: Array.from({ length: qty }, (_, index) => ({
    _id: mockId('customer'),
    name: `Cliente de prueba ${index + 1}`,
    email: `cliente-${index + 1}-${randomUUID()}@example.test`,
    role: USER_ROLES.CUSTOMER,
  })),
  drivers: Array.from({ length: qty }, (_, index) => ({
    _id: mockId('driver'),
    name: `Repartidor de prueba ${index + 1}`,
    email: `repartidor-${index + 1}-${randomUUID()}@example.test`,
    role: USER_ROLES.DRIVER,
  })),
})

const createMockStores = (qty) => Array.from({ length: qty }, (_, index) => ({
  _id: mockId('store'),
  name: `Tienda de prueba ${index + 1}`,
  address: `${100 + index} Avenida Central`,
}))

const createMockDataset = (qty) => {
  const users = createMockUsers(qty)
  const stores = createMockStores(qty)
  const priorities = Object.values(ORDER_PRIORITY)
  const orders = Array.from({ length: qty }, (_, index) => ({
    _id: mockId('order'),
    userId: users.customers[index]._id,
    storeId: stores[index]._id,
    address: `${200 + index} Calle de Entrega`,
    items: [{ name: `Producto de prueba ${index + 1}`, price: 1000 + index * 100, quantity: 1 }],
    total: 1000 + index * 100,
    status: ORDER_STATUS.PENDING,
    priority: priorities[index % priorities.length],
  }))
  const deliveries = orders.map((order, index) => ({
    _id: mockId('delivery'),
    orderId: order._id,
    driverId: users.drivers[index % users.drivers.length]._id,
    status: DELIVERY_STATUS.PENDING,
    assignedAt: new Date().toISOString(),
    deliveredAt: null,
  }))
  return { ...users, stores, orders, deliveries }
}

export const mocksService = {
  getUsers: (requestedQty) => {
    const { customers, drivers } = createMockUsers(quantity(requestedQty, 'users'))
    return { customers, drivers }
  },

  getOrders: (requestedQty) => {
    const { customers, stores, orders } = createMockDataset(quantity(requestedQty, 'orders'))
    return { customers, stores, orders }
  },

  getDeliveries: (requestedQty) => createMockDataset(quantity(requestedQty, 'deliveries')),

  seed: async (requestedQty) => {
    const qty = quantity(requestedQty, 'seed', true)
    try {
      const mockUsers = createMockUsers(qty)
      const mockStores = createMockStores(qty)
      const customers = []
      const drivers = []
      const stores = []
      const orders = []
      const deliveries = []

      for (const { _id, ...data } of mockUsers.customers) customers.push(await usersService.createUser(data))
      for (const { _id, ...data } of mockUsers.drivers) drivers.push(await usersService.createUser(data))
      for (const { _id, ...data } of mockStores) stores.push(await usersService.createStore(data))

      const priorities = Object.values(ORDER_PRIORITY)
      for (let index = 0; index < qty; index += 1) {
        orders.push(await ordersService.createOrder({
          userId: customers[index]._id,
          storeId: stores[index]._id,
          address: `${200 + index} Calle de Entrega`,
          items: [{ name: `Producto de prueba ${index + 1}`, price: 1000 + index * 100, quantity: 1 }],
          priority: priorities[index % priorities.length],
        }))
      }

      for (let index = 0; index < qty; index += 1) {
        deliveries.push(await deliveriesService.create({
          orderId: orders[index]._id,
          driverId: drivers[index % drivers.length]._id,
        }))
      }

      logger.info('Mock seed completed', {
        event: 'mock.seed.completed',
        counts: {
          customers: customers.length,
          drivers: drivers.length,
          stores: stores.length,
          orders: orders.length,
          deliveries: deliveries.length,
        },
      })

      return { customers, drivers, stores, orders, deliveries }
    } catch (error) {
      const seedError = new MockSeedFailedError(error)
      logger.error('Mock seed failed', {
        event: 'mock.seed.failed',
        ...safeErrorMetadata(seedError),
      })
      seedError.logged = true
      throw seedError
    }
  },
}
