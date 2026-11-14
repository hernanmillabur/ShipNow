import { expect } from 'chai'
import { spawnSync } from 'node:child_process'
import request from 'supertest'
import { ERROR_CATALOG } from '../src/errors/error-catalog.js'
import { logger } from '../src/logging/logger.js'
import { getTestApp } from './helpers/test-context.js'

const expectedLevels = ['debug', 'http', 'info', 'warning', 'error', 'fatal']
const productionResultMarker = '__SHIPNOW_LOGGER_TEST_RESULT__'

describe('Logger API', function () {
  it('GET /api/logging/test enumera los seis niveles y deja la app disponible', async function () {
    const response = await request(getTestApp()).get('/api/logging/test').expect(200)

    expect(response.body).to.deep.equal({
      status: 'success',
      payload: { levels: expectedLevels },
    })

    const followUp = await request(getTestApp()).get('/api/logging/test').expect(200)
    expect(followUp.body.payload.levels).to.deep.equal(expectedLevels)
    expect(logger.writable).to.equal(true)
  })

  it('GET /api/logging/test responde LOGGER_TEST_DISABLED en un proceso production aislado', function () {
    const childScript = `
      import request from 'supertest'
      const { default: app } = await import('./src/app.js')
      const response = await request(app).get('/api/logging/test')
      console.log('${productionResultMarker}' + JSON.stringify({ status: response.status, body: response.body }))
    `
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', childScript], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 15_000,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        MONGODB_URI: '',
      },
    })

    expect(child.error, child.error?.message).to.equal(undefined)
    expect(child.signal).to.equal(null)
    expect(child.status, child.stderr).to.equal(0)

    const resultLine = child.stdout
      .split(/\r?\n/)
      .find((line) => line.startsWith(productionResultMarker))
    expect(resultLine, child.stdout).to.be.a('string')

    const result = JSON.parse(resultLine.slice(productionResultMarker.length))
    expect(result).to.deep.equal({
      status: 404,
      body: {
        status: 'error',
        error: {
          code: 'LOGGER_TEST_DISABLED',
          message: ERROR_CATALOG.LOGGER_TEST_DISABLED.message,
        },
      },
    })
  })
})
