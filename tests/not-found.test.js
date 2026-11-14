import { expect } from 'chai'
import request from 'supertest'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import { getTestApp } from './helpers/test-context.js'
import { expectErrorResponse } from './helpers/fixtures.js'

describe('Unknown routes', function () {
  it('GET de una ruta inexistente responde ROUTE_NOT_FOUND con el envelope de errores', async function () {
    const response = await request(getTestApp()).get('/api/ruta-que-no-existe')

    expectErrorResponse(response, {
      status: 404,
      code: 'ROUTE_NOT_FOUND',
      message: ERROR_CATALOG.ROUTE_NOT_FOUND.message,
    })
  })
})
