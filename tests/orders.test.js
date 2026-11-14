import { expect } from 'chai'
import request from 'supertest'
import { ORDER_PRIORITY, ORDER_STATUS } from '../src/constants/index.js'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import { getTestApp } from './helpers/test-context.js'
import {
  createOrderFixture,
  createStoreFixture,
  createUserFixture,
  expectErrorResponse,
  nonexistentId,
} from './helpers/fixtures.js'

const validOrderInput = (userId, storeId) => ({
  userId: String(userId),
  storeId: String(storeId),
  address: 'Av. Prueba 123',
  items: [
    { name: 'Caja', price: 12.5, quantity: 2 },
    { name: 'Bolsa', price: 3, quantity: 1 },
  ],
})

describe('Orders API', function () {
  describe('GET /api/orders', function () {
    it('devuelve una lista vacía cuando no hay pedidos', async function () {
      const response = await request(getTestApp()).get('/api/orders').expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.be.an('array').that.is.empty
    })

    it('devuelve los pedidos con sus relaciones y campos principales', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const order = await createOrderFixture({ userId: user._id, storeId: store._id })

      const response = await request(getTestApp()).get('/api/orders').expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.be.an('array').with.lengthOf(1)
      expect(response.body.payload[0]).to.include({
        _id: String(order._id),
        userId: String(user._id),
        storeId: String(store._id),
        address: 'Dirección de entrega',
        total: 20,
        status: ORDER_STATUS.PENDING,
      })
      expect(response.body.payload[0].items).to.be.an('array').with.lengthOf(1)
      expect(response.body.payload[0].items[0]).to.include({
        name: 'Artículo de prueba',
        price: 10,
        quantity: 2,
      })
    })
  })

  describe('POST /api/orders', function () {
    it('crea un pedido, calcula el total y asigna su estado y prioridad iniciales', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const input = validOrderInput(user._id, store._id)

      const response = await request(getTestApp()).post('/api/orders').send(input).expect(201)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload._id).to.match(/^[a-f\d]{24}$/i)
      expect(response.body.payload).to.include({
        userId: String(user._id),
        storeId: String(store._id),
        address: input.address,
        total: 28,
        status: ORDER_STATUS.PENDING,
        priority: ORDER_PRIORITY.NORMAL,
      })
      expect(response.body.payload.items).to.be.an('array').with.lengthOf(2)
      input.items.forEach((item, index) => {
        expect(response.body.payload.items[index]).to.include(item)
      })
    })

    it('rechaza cada campo obligatorio ausente con VALIDATION_ERROR', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const base = validOrderInput(user._id, store._id)

      for (const requiredField of ['userId', 'storeId', 'address']) {
        const body = Object.fromEntries(
          Object.entries(base).filter(([key]) => key !== requiredField),
        )
        const response = await request(getTestApp()).post('/api/orders').send(body)
        expectErrorResponse(response, {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: ERROR_CATALOG.VALIDATION_ERROR.message,
        })
      }
    })

    it('rechaza address vacío o con un tipo distinto de string', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()

      for (const address of [123, '']) {
        const response = await request(getTestApp())
          .post('/api/orders')
          .send({ ...validOrderInput(user._id, store._id), address })

        expectErrorResponse(response, {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: ERROR_CATALOG.VALIDATION_ERROR.message,
        })
      }
    })

    it('rechaza items ausente o vacío con VALIDATION_ERROR', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const base = validOrderInput(user._id, store._id)

      for (const body of [
        Object.fromEntries(Object.entries(base).filter(([key]) => key !== 'items')),
        { ...base, items: [] },
      ]) {
        const response = await request(getTestApp()).post('/api/orders').send(body)
        expectErrorResponse(response, {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: ERROR_CATALOG.VALIDATION_ERROR.message,
        })
      }
    })

    it('rechaza items con tipos incorrectos sin responder INTERNAL_ERROR', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const base = validOrderInput(user._id, store._id)
      const invalidInputs = [
        { ...base, items: 'no-es-un-array' },
        { ...base, items: [{ name: 'Caja', price: 'doce', quantity: 2 }] },
        { ...base, items: [{ name: 'Caja', quantity: 2 }] },
        { ...base, items: [{ name: 'Caja', price: 12 }] },
        { ...base, items: [{ name: 123, price: 12, quantity: 2 }] },
        { ...base, items: [null] },
      ]

      for (const body of invalidInputs) {
        const response = await request(getTestApp()).post('/api/orders').send(body)
        expectErrorResponse(response, {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: ERROR_CATALOG.VALIDATION_ERROR.message,
        })
      }
    })

    it('rechaza referencias de usuario o tienda inexistentes', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const base = validOrderInput(user._id, store._id)

      const missingUser = await request(getTestApp())
        .post('/api/orders')
        .send({ ...base, userId: nonexistentId() })
      expectErrorResponse(missingUser, {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: ERROR_CATALOG.USER_NOT_FOUND.message,
      })

      const missingStore = await request(getTestApp())
        .post('/api/orders')
        .send({ ...base, storeId: nonexistentId() })
      expectErrorResponse(missingStore, {
        status: 404,
        code: 'STORE_NOT_FOUND',
        message: ERROR_CATALOG.STORE_NOT_FOUND.message,
      })
    })

    it('responde INVALID_ID si userId o storeId tienen formato inválido', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const base = validOrderInput(user._id, store._id)

      for (const body of [
        { ...base, userId: 'no-es-un-id' },
        { ...base, storeId: 'no-es-un-id' },
      ]) {
        const response = await request(getTestApp()).post('/api/orders').send(body)
        expectErrorResponse(response, {
          status: 400,
          code: 'INVALID_ID',
          message: ERROR_CATALOG.INVALID_ID.message,
        })
      }
    })
  })

  describe('GET /api/orders/:id', function () {
    it('devuelve un pedido existente con estructura correcta', async function () {
      const user = await createUserFixture()
      const store = await createStoreFixture()
      const order = await createOrderFixture({ userId: user._id, storeId: store._id })

      const response = await request(getTestApp()).get(`/api/orders/${order._id}`).expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.include({
        _id: String(order._id),
        userId: String(user._id),
        storeId: String(store._id),
        status: ORDER_STATUS.PENDING,
        total: 20,
      })
      expect(response.body.payload.items).to.be.an('array').with.lengthOf(1)
    })

    it('responde ORDER_NOT_FOUND para un ID válido inexistente', async function () {
      const response = await request(getTestApp()).get(`/api/orders/${nonexistentId()}`)

      expectErrorResponse(response, {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        message: ERROR_CATALOG.ORDER_NOT_FOUND.message,
      })
    })

    it('responde INVALID_ID para un ID con formato inválido', async function () {
      const response = await request(getTestApp()).get('/api/orders/no-es-un-id')

      expectErrorResponse(response, {
        status: 400,
        code: 'INVALID_ID',
        message: ERROR_CATALOG.INVALID_ID.message,
      })
    })
  })

  describe('PATCH /api/orders/:id/deliver', function () {
    it('marca como delivered un pedido pendiente y persiste el nuevo estado', async function () {
      const order = await createOrderFixture()

      const response = await request(getTestApp())
        .patch(`/api/orders/${order._id}/deliver`)
        .expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.include({
        _id: String(order._id),
        status: ORDER_STATUS.DELIVERED,
      })

      const persisted = await request(getTestApp()).get(`/api/orders/${order._id}`).expect(200)
      expect(persisted.body.payload.status).to.equal(ORDER_STATUS.DELIVERED)
    })

    it('responde ORDER_NOT_FOUND para un pedido inexistente', async function () {
      const response = await request(getTestApp()).patch(`/api/orders/${nonexistentId()}/deliver`)

      expectErrorResponse(response, {
        status: 404,
        code: 'ORDER_NOT_FOUND',
        message: ERROR_CATALOG.ORDER_NOT_FOUND.message,
      })
    })

    it('responde INVALID_ID para un ID con formato inválido', async function () {
      const response = await request(getTestApp()).patch('/api/orders/no-es-un-id/deliver')

      expectErrorResponse(response, {
        status: 400,
        code: 'INVALID_ID',
        message: ERROR_CATALOG.INVALID_ID.message,
      })
    })

    it('responde INVALID_STATE si el pedido ya está entregado', async function () {
      const order = await createOrderFixture({ status: ORDER_STATUS.DELIVERED })
      const response = await request(getTestApp()).patch(`/api/orders/${order._id}/deliver`)

      expectErrorResponse(response, {
        status: 400,
        code: 'INVALID_STATE',
        message: ERROR_CATALOG.INVALID_STATE.message,
      })
    })
  })
})
