import mongoose from 'mongoose'
import { validateConfig } from './config/env.config.js'

let server
let logger
let shuttingDown = false

const closeLogger = () => new Promise((resolve) => {
  logger.once('finish', resolve)
  logger.end()
})

const closeHttpServer = () => new Promise((resolve, reject) => {
  if (!server) return resolve()
  server.close((error) => error ? reject(error) : resolve())
})

const shutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('ShipNow shutdown requested', { event: 'server.shutdown', signal })
  try {
    await closeHttpServer()
    await mongoose.disconnect()
    await closeLogger()
  } catch {
    process.exitCode = 1
    process.stderr.write('ShipNow shutdown encountered an error.\n')
    await closeLogger()
  }
}

const start = async () => {
  let settings
  try {
    settings = validateConfig()
  } catch (error) {
    process.stderr.write(`ShipNow configuration invalid: ${error.message}\n`)
    process.exitCode = 1
    return
  }

  let app
  let safeErrorMetadata
  try {
    const [appModule, logging] = await Promise.all([
      import('./app.js'),
      import('./logging/logger.js'),
    ])
    app = appModule.default
    logger = logging.logger
    safeErrorMetadata = logging.safeErrorMetadata
    await mongoose.connect(settings.mongoUri, { serverSelectionTimeoutMS: 10_000 })
  } catch (error) {
    if (logger) {
      logger.fatal('ShipNow startup failed', {
        event: 'server.start.failed',
        ...safeErrorMetadata(error),
      })
    } else {
      process.stderr.write('ShipNow could not initialize logging or connect to MongoDB.\n')
    }
    process.exitCode = 1
    await mongoose.disconnect().catch(() => {})
    if (logger) await closeLogger()
    return
  }

  server = app.listen(settings.port, () => {
    logger.info('ShipNow HTTP server listening', {
      event: 'server.listening',
      port: settings.port,
      nodeEnv: settings.nodeEnv,
    })
  })
  server.on('error', async (error) => {
    logger.fatal('ShipNow HTTP server failed to start', {
      event: 'server.start.failed',
      ...safeErrorMetadata(error),
    })
    process.exitCode = 1
    await mongoose.disconnect()
    await closeLogger()
  })
  process.once('SIGTERM', () => { void shutdown('SIGTERM') })
  process.once('SIGINT', () => { void shutdown('SIGINT') })
}

void start()
