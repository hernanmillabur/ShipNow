import { expect } from 'chai'
import request from 'supertest'
import { swaggerSpec } from '../src/config/swagger.config.js'
import { getTestApp } from './helpers/test-context.js'

describe('Swagger UI', function () {
  it('publica OpenAPI 3 con paginación y health check', function () {
    expect(swaggerSpec.openapi).to.equal('3.0.3')
    expect(swaggerSpec.paths['/api/health'].get).to.exist
    expect(swaggerSpec.paths['/api/health'].get.responses['503']).to.exist
    expect(swaggerSpec.components.schemas.Pagination.properties.totalItems).to.exist
    expect(swaggerSpec.paths['/api/orders'].get.parameters.map(({ name }) => name)).to.include.members(['page', 'limit', 'status', 'priority', 'userId', 'storeId'])
    expect(swaggerSpec.paths['/api/products'].get.responses['200'].content['application/json'].schema.allOf[1].properties.payload.$ref).to.equal('#/components/schemas/ProductPage')
  })

  it('GET /api/docs/ responde con HTML de Swagger UI', async function () {
    const response = await request(getTestApp()).get('/api/docs/').expect(200)

    expect(response.headers['content-type']).to.match(/text\/html/i)
    expect(response.text).to.include('Swagger UI')
    expect(response.text).to.include('swagger-ui')
  })
})
