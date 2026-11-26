import { expect } from 'chai'
import { spawnSync } from 'node:child_process'
import mongoose from 'mongoose'
import request from 'supertest'
import { validateConfig } from '../src/config/env.config.js'
import { getTestApp } from './helpers/test-context.js'

const base = { PORT: '8080', MONGODB_URI: 'mongodb://localhost/test', NODE_ENV: 'test' }
const temporarilySet = async (values, action) => {
  const prior = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]))
  Object.assign(process.env, Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])))
  try { return await action() } finally {
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe('Health check and environment configuration', function () {
  it('GET /api/health returns stable public fields without environment secrets', async function () {
    expect(mongoose.connection.readyState).to.equal(1)
    const response = await request(getTestApp()).get('/api/health').expect(200)
    expect(response.body.status).to.equal('ok')
    expect(response.body.environment).to.equal('test')
    expect(response.body.uptimeSeconds).to.be.a('number')
    expect(Number.isFinite(Date.parse(response.body.timestamp))).to.equal(true)
    expect(response.text).not.to.include('mongodb://')
    expect(response.text).not.to.include('MONGODB_URI')
    expect(response.text).not.to.include(process.cwd())
  })

  it('GET /api/health returns 503 while Mongoose is disconnected without exposing internals', async function () {
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 0 })
    try {
      const response = await request(getTestApp()).get('/api/health').expect(503)
      expect(response.body).to.include({ status: 'unavailable', environment: 'test' })
      expect(response.body).to.have.all.keys('status', 'environment', 'uptimeSeconds', 'timestamp')
      expect(response.text).not.to.include('mongodb://')
      expect(response.text).not.to.include('MONGODB_URI')
      expect(response.text).not.to.include(process.cwd())
    } finally {
      delete mongoose.connection.readyState
    }
  })

  it('validates required variables and accepted values before startup', function () {
    expect(() => validateConfig({ ...base, PORT: undefined })).to.throw()
    expect(() => validateConfig({ ...base, MONGODB_URI: undefined })).to.throw()
    expect(() => validateConfig({ ...base, NODE_ENV: undefined })).to.throw()
    expect(() => validateConfig({ ...base, PORT: '70000' })).to.throw()
    expect(() => validateConfig({ ...base, NODE_ENV: 'staging' })).to.throw()
    expect(() => validateConfig({ ...base, LOG_LEVEL: 'trace' })).to.throw()
    expect(() => validateConfig({ ...base, SWAGGER_ENABLED: 'yes' })).to.throw()
    expect(() => validateConfig({ ...base, LOG_TO_FILE: 'sometimes' })).to.throw()
  })

  it('uses environment defaults and permits explicit production Swagger', function () {
    expect(validateConfig(base)).to.include({ logLevel: 'debug', swaggerEnabled: true, logToFile: false })
    expect(validateConfig({ ...base, NODE_ENV: 'production' }).swaggerEnabled).to.equal(false)
    expect(validateConfig({ ...base, NODE_ENV: 'production', SWAGGER_ENABLED: 'true' }).swaggerEnabled).to.equal(true)
  })

  it('does not open HTTP when the initial MongoDB connection fails', function () {
    const child = spawnSync(process.execPath, ['src/server.js'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 20_000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '51883',
        MONGODB_URI: 'mongodb://127.0.0.1:1/shipnow',
        LOG_LEVEL: 'fatal',
        LOG_TO_FILE: 'false',
        SWAGGER_ENABLED: 'false',
      },
    })
    expect(child.error, child.error?.message).to.equal(undefined)
    expect(child.status, child.stderr).to.equal(1)
    expect(child.stdout + child.stderr).not.to.include('server.listening')
  })

  it('rejects invalid process configuration before importing the app or opening HTTP', function () {
    const cases = [
      { name: 'PORT', env: { PORT: '' } },
      { name: 'MONGODB_URI', env: { MONGODB_URI: '' } },
      { name: 'NODE_ENV', env: { NODE_ENV: 'staging' } },
      { name: 'LOG_LEVEL', env: { LOG_LEVEL: 'trace' } },
    ]
    for (const testCase of cases) {
      const child = spawnSync(process.execPath, ['src/server.js'], {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5_000,
        env: {
          ...process.env,
          PORT: '51884',
          MONGODB_URI: 'mongodb://127.0.0.1:1/never-connect',
          NODE_ENV: 'test',
          LOG_LEVEL: 'info',
          LOG_TO_FILE: 'false',
          SWAGGER_ENABLED: 'false',
          ...testCase.env,
        },
      })
      const output = child.stdout + child.stderr
      expect(child.error, `${testCase.name}: ${child.error?.message}`).to.equal(undefined)
      expect(child.status, `${testCase.name}: ${output}`).to.equal(1)
      expect(output, testCase.name).to.include(`ShipNow configuration invalid:`)
      expect(output, testCase.name).to.include(testCase.name)
      expect(output, testCase.name).not.to.include('server.listening')
    }
  })

  it('applies production endpoint policy and retains health availability', async function () {
    await temporarilySet({ NODE_ENV: 'production', SWAGGER_ENABLED: 'false' }, async () => {
      expect((await request(getTestApp()).get('/api/health')).status).to.equal(200)
      expect((await request(getTestApp()).get('/api/mocks/users')).status).to.equal(404)
      expect((await request(getTestApp()).post('/api/mocks/seed').send({ qty: 1 })).status).to.equal(404)
      expect((await request(getTestApp()).get('/api/docs/')).status).to.equal(404)
    })
    await temporarilySet({ NODE_ENV: 'production', SWAGGER_ENABLED: 'true' }, async () => {
      expect((await request(getTestApp()).get('/api/docs/')).status).to.equal(200)
    })
    await temporarilySet({ NODE_ENV: 'development', SWAGGER_ENABLED: 'true' }, async () => {
      expect((await request(getTestApp()).get('/api/mocks/users')).status).to.equal(200)
    })
  })
})
