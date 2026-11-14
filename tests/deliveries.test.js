import { expect } from 'chai'
import request from 'supertest'
import { DELIVERY_STATUS, USER_ROLES } from '../src/constants/index.js'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import DeliveryModel from '../src/models/delivery.model.js'
import { getTestApp } from './helpers/test-context.js'
import {
  createOrderFixture,
  createUserFixture,
  expectErrorResponse,
  nonexistentId,
} from './helpers/fixtures.js'

describe('Deliveries API', function () {
  it('crea una entrega para un pedido y un usuario con rol driver', async function () {
    const order = await createOrderFixture()
    const driver = await createUserFixture({ role: USER_ROLES.DRIVER })

    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({ orderId: String(order._id), driverId: String(driver._id) })
      .expect(201)

    expect(response.body).to.have.property('status', 'success')
    expect(response.body.payload).to.include({
      orderId: String(order._id),
      driverId: String(driver._id),
      status: DELIVERY_STATUS.PENDING,
      deliveredAt: null,
    })
    expect(response.body.payload._id).to.match(/^[a-f\d]{24}$/i)
    expect(response.body.payload.assignedAt).to.be.a('string')
    expect(Number.isNaN(Date.parse(response.body.payload.assignedAt))).to.equal(false)
    expect(Number.isNaN(Date.parse(response.body.payload.createdAt))).to.equal(false)
    expect(Number.isNaN(Date.parse(response.body.payload.updatedAt))).to.equal(false)
  })

  it('persiste un estado explícito permitido por el contrato', async function () {
    const order = await createOrderFixture()
    const driver = await createUserFixture({ role: USER_ROLES.DRIVER })

    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({
        orderId: String(order._id),
        driverId: String(driver._id),
        status: DELIVERY_STATUS.IN_TRANSIT,
      })
      .expect(201)

    expect(response.body).to.have.property('status', 'success')
    expect(response.body.payload).to.include({
      orderId: String(order._id),
      driverId: String(driver._id),
      status: DELIVERY_STATUS.IN_TRANSIT,
    })
    const persisted = await DeliveryModel.findById(response.body.payload._id).lean()
    expect(persisted).to.exist
    expect(persisted.status).to.equal(DELIVERY_STATUS.IN_TRANSIT)
  })

  it('rechaza cada referencia obligatoria ausente', async function () {
    const order = await createOrderFixture()
    const driver = await createUserFixture({ role: USER_ROLES.DRIVER })
    const incompleteBodies = [
      {},
      { orderId: String(order._id) },
      { driverId: String(driver._id) },
    ]

    for (const body of incompleteBodies) {
      const response = await request(getTestApp()).post('/api/deliveries').send(body)
      expectErrorResponse(response, {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: ERROR_CATALOG.VALIDATION_ERROR.message,
      })
    }
  })

  it('responde INVALID_ID si el ID del pedido tiene formato inválido', async function () {
    const driver = await createUserFixture({ role: USER_ROLES.DRIVER })
    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({ orderId: 'no-es-un-id', driverId: String(driver._id) })

    expectErrorResponse(response, {
      status: 400,
      code: 'INVALID_ID',
      message: ERROR_CATALOG.INVALID_ID.message,
    })
  })

  it('responde ORDER_NOT_FOUND si el pedido no existe', async function () {
    const driver = await createUserFixture({ role: USER_ROLES.DRIVER })
    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({ orderId: nonexistentId(), driverId: String(driver._id) })

    expectErrorResponse(response, {
      status: 404,
      code: 'ORDER_NOT_FOUND',
      message: ERROR_CATALOG.ORDER_NOT_FOUND.message,
    })
  })

  it('responde INVALID_ID si el ID del repartidor tiene formato inválido', async function () {
    const order = await createOrderFixture()
    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({ orderId: String(order._id), driverId: 'no-es-un-id' })

    expectErrorResponse(response, {
      status: 400,
      code: 'INVALID_ID',
      message: ERROR_CATALOG.INVALID_ID.message,
    })
  })

  it('responde DRIVER_NOT_FOUND si el usuario no existe', async function () {
    const order = await createOrderFixture()
    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({ orderId: String(order._id), driverId: nonexistentId() })

    expectErrorResponse(response, {
      status: 404,
      code: 'DRIVER_NOT_FOUND',
      message: ERROR_CATALOG.DRIVER_NOT_FOUND.message,
    })
  })

  it('responde INVALID_DRIVER_ROLE si el usuario no es repartidor', async function () {
    const order = await createOrderFixture()
    const customer = await createUserFixture({ role: USER_ROLES.CUSTOMER })
    const response = await request(getTestApp())
      .post('/api/deliveries')
      .send({ orderId: String(order._id), driverId: String(customer._id) })

    expectErrorResponse(response, {
      status: 400,
      code: 'INVALID_DRIVER_ROLE',
      message: ERROR_CATALOG.INVALID_DRIVER_ROLE.message,
    })
  })
})
