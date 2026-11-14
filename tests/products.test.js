import { expect } from 'chai'
import request from 'supertest'
import { PRODUCT_STATUS } from '../src/constants/index.js'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import ProductModel from '../src/models/product.model.js'
import { productsRepository } from '../src/repositories/products.repository.js'
import { getTestApp } from './helpers/test-context.js'
import { expectErrorResponse, nonexistentId } from './helpers/fixtures.js'

const productInput = (overrides = {}) => ({
  name: 'Producto funcional',
  description: 'Producto de prueba',
  price: 12.5,
  stock: 4,
  ...overrides,
})

const createProduct = async (overrides = {}) => {
  const response = await request(getTestApp())
    .post('/api/products')
    .send(productInput(overrides))
    .expect(201)
  return response.body.payload
}

describe('Products API', function () {
  describe('GET /api/products', function () {
    it('devuelve una lista de productos con sus campos principales', async function () {
      const created = await createProduct()
      const response = await request(getTestApp()).get('/api/products').expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.be.an('array').with.lengthOf(1)
      expect(response.body.payload[0]).to.include({
        _id: String(created._id),
        name: 'Producto funcional',
        description: 'Producto de prueba',
        price: 12.5,
        stock: 4,
        status: PRODUCT_STATUS.AVAILABLE,
      })
    })

    it('responde INTERNAL_ERROR si falla el repositorio', async function () {
      const originalGetAll = productsRepository.getAll
      productsRepository.getAll = async () => {
        throw new Error('Falla de lectura controlada para el test')
      }

      try {
        const response = await request(getTestApp()).get('/api/products')
        expectErrorResponse(response, {
          status: 500,
          code: 'INTERNAL_ERROR',
          message: ERROR_CATALOG.INTERNAL_ERROR.message,
        })
      } finally {
        productsRepository.getAll = originalGetAll
      }
    })
  })

  describe('GET /api/products/:id', function () {
    it('devuelve un producto existente', async function () {
      const created = await createProduct()
      const response = await request(getTestApp())
        .get(`/api/products/${created._id}`)
        .expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.include({
        _id: String(created._id),
        name: 'Producto funcional',
        price: 12.5,
        stock: 4,
        status: PRODUCT_STATUS.AVAILABLE,
      })
    })

    it('responde PRODUCT_NOT_FOUND para un ID válido inexistente', async function () {
      const response = await request(getTestApp()).get(`/api/products/${nonexistentId()}`)

      expectErrorResponse(response, {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: ERROR_CATALOG.PRODUCT_NOT_FOUND.message,
      })
    })
  })

  describe('POST /api/products', function () {
    it('crea un producto, deriva su estado y lo persiste', async function () {
      const response = await request(getTestApp())
        .post('/api/products')
        .send(productInput())
        .expect(201)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.include({
        name: 'Producto funcional',
        description: 'Producto de prueba',
        price: 12.5,
        stock: 4,
        status: PRODUCT_STATUS.AVAILABLE,
      })
      expect(response.body.payload._id).to.match(/^[a-f\d]{24}$/i)
      expect(await ProductModel.countDocuments({ _id: response.body.payload._id })).to.equal(1)
    })

    it('rechaza un precio negativo con INVALID_PRODUCT_PRICE', async function () {
      const response = await request(getTestApp())
        .post('/api/products')
        .send(productInput({ price: -1 }))

      expectErrorResponse(response, {
        status: 400,
        code: 'INVALID_PRODUCT_PRICE',
        message: ERROR_CATALOG.INVALID_PRODUCT_PRICE.message,
      })
    })
  })

  describe('PUT /api/products/:id', function () {
    it('actualiza un producto y recalcula el estado según el stock', async function () {
      const created = await createProduct()
      const response = await request(getTestApp())
        .put(`/api/products/${created._id}`)
        .send({ stock: 0 })
        .expect(200)

      expect(response.body).to.have.property('status', 'success')
      expect(response.body.payload).to.include({
        _id: String(created._id),
        name: 'Producto funcional',
        price: 12.5,
        stock: 0,
        status: PRODUCT_STATUS.OUT_OF_STOCK,
      })
      const persisted = await ProductModel.findById(created._id).lean()
      expect(persisted.stock).to.equal(0)
      expect(persisted.status).to.equal(PRODUCT_STATUS.OUT_OF_STOCK)
    })

    it('rechaza un precio negativo con INVALID_PRODUCT_PRICE', async function () {
      const created = await createProduct()
      const response = await request(getTestApp())
        .put(`/api/products/${created._id}`)
        .send({ price: -1 })

      expectErrorResponse(response, {
        status: 400,
        code: 'INVALID_PRODUCT_PRICE',
        message: ERROR_CATALOG.INVALID_PRODUCT_PRICE.message,
      })
    })
  })

  describe('DELETE /api/products/:id', function () {
    it('elimina un producto existente y devuelve 204 sin body', async function () {
      const created = await createProduct()
      const response = await request(getTestApp())
        .delete(`/api/products/${created._id}`)
        .expect(204)

      expect(response.text).to.equal('')
      expect(await ProductModel.findById(created._id)).to.equal(null)
    })

    it('responde PRODUCT_NOT_FOUND para un ID válido inexistente', async function () {
      const response = await request(getTestApp()).delete(`/api/products/${nonexistentId()}`)

      expectErrorResponse(response, {
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: ERROR_CATALOG.PRODUCT_NOT_FOUND.message,
      })
    })
  })
})
