import express from 'express'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './helpers/database.js'
import { clearTestApp, setTestApp } from './helpers/test-context.js'

export const mochaHooks = {
  beforeAll: async function () {
    this.timeout(120_000)

    process.env.NODE_ENV = 'test'
    process.env.PORT = '8080'

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
  },

  afterAll: async function () {
    try {
      await stopTestDatabase()
    } finally {
      clearTestApp()
    }
  },
}
