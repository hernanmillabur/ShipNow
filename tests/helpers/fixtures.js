import { expect } from 'chai'
import mongoose from 'mongoose'
import { ORDER_STATUS, USER_ROLES } from '../../src/constants/index.js'
import OrderModel from '../../src/models/order.model.js'
import StoreModel from '../../src/models/store.model.js'
import UserModel from '../../src/models/user.model.js'

let fixtureNumber = 0

const nextEmail = () => {
  fixtureNumber += 1
  return `shipnow-test-${Date.now()}-${fixtureNumber}@example.test`
}

export const createUserFixture = (overrides = {}) => UserModel.create({
  name: 'Usuario de prueba',
  email: nextEmail(),
  role: USER_ROLES.CUSTOMER,
  ...overrides,
})

export const createStoreFixture = (overrides = {}) => StoreModel.create({
  name: 'Tienda de prueba',
  address: 'Dirección de prueba',
  ...overrides,
})

export const createOrderFixture = async ({
  userId,
  storeId,
  status = ORDER_STATUS.PENDING,
  priority,
  address = 'Dirección de entrega',
  items = [{ name: 'Artículo de prueba', price: 10, quantity: 2 }],
} = {}) => {
  const user = userId ? undefined : await createUserFixture()
  const store = storeId ? undefined : await createStoreFixture()
  const orderItems = items

  return OrderModel.create({
    userId: userId ?? user._id,
    storeId: storeId ?? store._id,
    address,
    items: orderItems,
    total: orderItems.reduce((total, item) => total + item.price * item.quantity, 0),
    status,
    ...(priority ? { priority } : {}),
  })
}

export const nonexistentId = () => new mongoose.Types.ObjectId().toString()

export const expectErrorResponse = (response, { status, code, message }) => {
  expect(response.status).to.equal(status)
  expect(response.body).to.have.property('status', 'error')
  expect(response.body).to.have.property('error')
  expect(response.body.error).to.deep.equal({ code, message })
}
