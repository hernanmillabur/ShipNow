import express from 'express'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/database.js'
import { clearTestApp, setTestApp } from './helpers/test-context.js'

const envNames = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'UPLOADS_DIR', 'LOG_LEVEL', 'LOG_TO_FILE', 'SWAGGER_ENABLED']
const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]))
let temporaryUploadsDirectory

const restoreEnvironment = () => {
  for (const name of envNames) {
    if (originalEnv[name] === undefined) delete process.env[name]
    else process.env[name] = originalEnv[name]
  }
}

export const mochaHooks = {
  beforeAll: async function () {
    this.timeout(120_000)

    process.env.NODE_ENV = 'test'
    process.env.PORT = '8080'
    process.env.LOG_LEVEL = 'debug'
    process.env.LOG_TO_FILE = 'false'
    process.env.SWAGGER_ENABLED = 'true'
    temporaryUploadsDirectory = await mkdtemp(join(tmpdir(), 'shipnow-uploads-'))
    process.env.UPLOADS_DIR = temporaryUploadsDirectory

    const temporaryUri = await startTestDatabase()
    process.env.MONGODB_URI = temporaryUri

    const originalListen = express.application.listen
    express.application.listen = function () {
      throw new Error('src/app.js no debe iniciar un servidor HTTP al importarse')
    }

    let app
    try {
      ;({ default: app } = await import('../src/app.js'))
    } finally {
      express.application.listen = originalListen
    }

    app.listen = originalListen
    setTestApp(app)
  },

  beforeEach: async function () {
    await clearTestDatabase()
    await rm(temporaryUploadsDirectory, { recursive: true, force: true })
    await mkdir(temporaryUploadsDirectory, { recursive: true })
  },

  afterAll: async function () {
    try {
      await stopTestDatabase()
    } finally {
      clearTestApp()
      try {
        if (temporaryUploadsDirectory) {
          await rm(temporaryUploadsDirectory, { recursive: true, force: true })
        }
      } finally {
        restoreEnvironment()
      }
    }
  },
}
