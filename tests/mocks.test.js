import { expect } from 'chai'
import request from 'supertest'
import DeliveryModel from '../src/models/delivery.model.js'
import OrderModel from '../src/models/order.model.js'
import StoreModel from '../src/models/store.model.js'
import UserModel from '../src/models/user.model.js'
import { usersRepository } from '../src/repositories/users.repository.js'
import { DELIVERY_STATUS, ORDER_STATUS, USER_ROLES } from '../src/constants/index.js'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import { getTestApp } from './helpers/test-context.js'
import { expectErrorResponse } from './helpers/fixtures.js'

const entityCounts = async () => ({
  users: await UserModel.countDocuments(),
  stores: await StoreModel.countDocuments(),
  orders: await OrderModel.countDocuments(),
  deliveries: await DeliveryModel.countDocuments(),
})

const expectSuccessfulPayload = (response) => {
  expect(response.body).to.have.property('status', 'success')
  expect(response.body.payload).to.be.an('object')
}

describe('Mocks API', function () {
  it('GET /api/mocks/users genera customers y drivers en memoria', async function () {
    const before = await entityCounts()
    const response = await request(getTestApp()).get('/api/mocks/users?qty=3').expect(200)
    expectSuccessfulPayload(response)

    const { customers, drivers } = response.body.payload
    expect(customers).to.have.lengthOf(3)
    expect(drivers).to.have.lengthOf(3)
    expect(customers[0]).to.include({ role: USER_ROLES.CUSTOMER })
    expect(customers[0]._id).to.match(/^mock-customer-/)
    expect(customers[0].name).to.be.a('string').and.not.empty
    expect(customers[0].email).to.match(/@example\.test$/)
    expect(drivers[0]).to.include({ role: USER_ROLES.DRIVER })
    expect(drivers[0]._id).to.match(/^mock-driver-/)
    expect(drivers[0].email).to.match(/@example\.test$/)
    expect(await entityCounts()).to.deep.equal(before)
  })

  it('GET /api/mocks/orders genera customers, stores y orders relacionados en memoria', async function () {
    const before = await entityCounts()
    const response = await request(getTestApp()).get('/api/mocks/orders?qty=3').expect(200)
    expectSuccessfulPayload(response)

    const { customers, stores, orders } = response.body.payload
    expect(customers).to.have.lengthOf(3)
    expect(stores).to.have.lengthOf(3)
    expect(orders).to.have.lengthOf(3)
    expect(orders[0]).to.include({
      userId: customers[0]._id,
      storeId: stores[0]._id,
      status: ORDER_STATUS.PENDING,
    })
    expect(orders[0]._id).to.match(/^mock-order-/)
    expect(orders[0].items).to.be.an('array').with.lengthOf(1)
    expect(orders[0].total).to.equal(
      orders[0].items.reduce((total, item) => total + item.price * item.quantity, 0),
    )
    expect(await entityCounts()).to.deep.equal(before)
  })

  it('GET /api/mocks/deliveries genera las entidades y referencias relacionadas en memoria', async function () {
    const before = await entityCounts()
    const response = await request(getTestApp()).get('/api/mocks/deliveries?qty=3').expect(200)
    expectSuccessfulPayload(response)

    const { customers, drivers, stores, orders, deliveries } = response.body.payload
    expect(customers).to.have.lengthOf(3)
    expect(drivers).to.have.lengthOf(3)
    expect(stores).to.have.lengthOf(3)
    expect(orders).to.have.lengthOf(3)
    expect(deliveries).to.have.lengthOf(3)
    expect(drivers[0].role).to.equal(USER_ROLES.DRIVER)

    deliveries.forEach((delivery, index) => {
      expect(delivery.orderId).to.equal(orders[index]._id)
      expect(delivery.driverId).to.equal(drivers[index % drivers.length]._id)
      expect(delivery.status).to.equal(DELIVERY_STATUS.PENDING)
      expect(delivery.assignedAt).to.be.a('string')
      expect(delivery.deliveredAt).to.equal(null)
    })
    orders.forEach((order, index) => {
      expect(order.userId).to.equal(customers[index]._id)
      expect(order.storeId).to.equal(stores[index]._id)
    })
    expect(await entityCounts()).to.deep.equal(before)
  })

  for (const endpoint of ['/api/mocks/users', '/api/mocks/orders', '/api/mocks/deliveries']) {
    it(`${endpoint} rechaza qty=abc, qty=0 y qty=101`, async function () {
      for (const qty of ['abc', '0', '101']) {
        const response = await request(getTestApp()).get(`${endpoint}?qty=${qty}`)
        expectErrorResponse(response, {
          status: 400,
          code: 'INVALID_MOCK_QUANTITY',
          message: ERROR_CATALOG.INVALID_MOCK_QUANTITY.message,
        })
      }
    })
  }

  it('POST /api/mocks/seed persiste datos relacionados en MongoDB temporal', async function () {
    const response = await request(getTestApp()).post('/api/mocks/seed').send({ qty: 2 }).expect(201)
    expectSuccessfulPayload(response)

    const { customers, drivers, stores, orders, deliveries } = response.body.payload
    expect(customers).to.have.lengthOf(2)
    expect(drivers).to.have.lengthOf(2)
    expect(stores).to.have.lengthOf(2)
    expect(orders).to.have.lengthOf(2)
    expect(deliveries).to.have.lengthOf(2)
    expect(await entityCounts()).to.deep.equal({ users: 4, stores: 2, orders: 2, deliveries: 2 })

    const customerIds = customers.map((user) => String(user._id))
    const driverIds = drivers.map((user) => String(user._id))
    const storeIds = stores.map((store) => String(store._id))
    const orderIds = orders.map((order) => String(order._id))

    const persistedCustomers = await UserModel.find({ _id: { $in: customerIds }, role: USER_ROLES.CUSTOMER }).lean()
    const persistedDrivers = await UserModel.find({ _id: { $in: driverIds }, role: USER_ROLES.DRIVER }).lean()
    const persistedStores = await StoreModel.find({ _id: { $in: storeIds } }).lean()
    const persistedOrders = await OrderModel.find({ _id: { $in: orderIds } }).lean()
    const persistedDeliveries = await DeliveryModel.find({
      _id: { $in: deliveries.map((delivery) => delivery._id) },
    }).lean()

    expect(persistedCustomers.map((user) => String(user._id))).to.have.members(customerIds)
    expect(persistedDrivers.map((user) => String(user._id))).to.have.members(driverIds)
    expect(persistedStores.map((store) => String(store._id))).to.have.members(storeIds)
    expect(persistedOrders.map((order) => String(order._id))).to.have.members(orderIds)
    expect(persistedDeliveries.map((delivery) => String(delivery._id)))
      .to.have.members(deliveries.map((delivery) => String(delivery._id)))

    const persistedCustomerIds = new Set(persistedCustomers.map((user) => String(user._id)))
    const persistedDriverIds = new Set(persistedDrivers.map((user) => String(user._id)))
    const persistedStoreIds = new Set(persistedStores.map((store) => String(store._id)))
    const persistedOrderIds = new Set(persistedOrders.map((order) => String(order._id)))
    orders.forEach((order) => {
      expect(persistedCustomerIds.has(String(order.userId))).to.equal(true)
      expect(persistedStoreIds.has(String(order.storeId))).to.equal(true)
      expect(order.status).to.equal(ORDER_STATUS.PENDING)
    })
    persistedOrders.forEach((order) => {
      expect(persistedCustomerIds.has(String(order.userId))).to.equal(true)
      expect(persistedStoreIds.has(String(order.storeId))).to.equal(true)
    })
    persistedDeliveries.forEach((delivery) => {
      expect(persistedOrderIds.has(String(delivery.orderId))).to.equal(true)
      expect(persistedDriverIds.has(String(delivery.driverId))).to.equal(true)
      expect(delivery.status).to.equal(DELIVERY_STATUS.PENDING)
    })
  })

  it('POST /api/mocks/seed rechaza qty inválido en el body', async function () {
    const response = await request(getTestApp()).post('/api/mocks/seed').send({ qty: 101 })
    expectErrorResponse(response, {
      status: 400,
      code: 'INVALID_MOCK_QUANTITY',
      message: ERROR_CATALOG.INVALID_MOCK_QUANTITY.message,
    })
  })

  it('POST /api/mocks/seed rechaza qty inválido en query', async function () {
    const response = await request(getTestApp()).post('/api/mocks/seed?qty=0').send({})
    expectErrorResponse(response, {
      status: 400,
      code: 'INVALID_MOCK_QUANTITY',
      message: ERROR_CATALOG.INVALID_MOCK_QUANTITY.message,
    })
  })

  it('POST /api/mocks/seed convierte una falla de persistencia en MOCK_SEED_FAILED', async function () {
    const originalCreate = usersRepository.create
    usersRepository.create = async () => {
      throw new Error('Falla de persistencia controlada para el test')
    }

    try {
      const response = await request(getTestApp())
        .post('/api/mocks/seed')
        .send({ qty: 1 })

      expectErrorResponse(response, {
        status: 500,
        code: 'MOCK_SEED_FAILED',
        message: ERROR_CATALOG.MOCK_SEED_FAILED.message,
      })
      expect(await UserModel.countDocuments()).to.equal(0)
    } finally {
      usersRepository.create = originalCreate
    }
  })

  it('POST /api/mocks/seed prioriza qty del body sobre qty de query', async function () {
    const response = await request(getTestApp())
      .post('/api/mocks/seed?qty=1')
      .send({ qty: 2 })
      .expect(201)

    expectSuccessfulPayload(response)
    expect(response.body.payload.customers).to.have.lengthOf(2)
    expect(response.body.payload.orders).to.have.lengthOf(2)
    expect(response.body.payload.deliveries).to.have.lengthOf(2)
    expect(await entityCounts()).to.deep.equal({ users: 4, stores: 2, orders: 2, deliveries: 2 })
  })
})
