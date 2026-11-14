import { expect } from 'chai'
import request from 'supertest'
import { getTestApp } from './helpers/test-context.js'

describe('Swagger UI', function () {
  it('GET /api/docs/ responde con HTML de Swagger UI', async function () {
    const response = await request(getTestApp()).get('/api/docs/').expect(200)

    expect(response.headers['content-type']).to.match(/text\/html/i)
    expect(response.text).to.include('Swagger UI')
    expect(response.text).to.include('swagger-ui')
  })
})
