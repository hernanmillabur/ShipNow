import { setServers } from 'node:dns'
import mongoose from 'mongoose'
import { config } from './config/env.config.js'
import app from './app.js'
import { logger, safeErrorMetadata } from './logging/logger.js'

setServers(['1.1.1.1'])

const { port, mongoUri, nodeEnv } = config

const connectMongo = async () => {
  try {
    await mongoose.connect(mongoUri)
    logger.info('MongoDB connected', { event: 'mongodb.connected' })
  } catch (error) {
    logger.warning('MongoDB connection failed; retry scheduled', {
      event: 'mongodb.connection.retry',
      retryDelayMs: 5000,
      ...safeErrorMetadata(error),
    })
    setTimeout(connectMongo, 5000)
  }
}

const server = app.listen(port, () => {
  logger.info('ShipNow HTTP server listening', {
    event: 'server.listening',
    port,
    nodeEnv,
  })
  void connectMongo()
})

server.on('error', (error) => {
  logger.fatal('ShipNow HTTP server failed to start', {
    event: 'server.start.failed',
    ...safeErrorMetadata(error),
  })
  logger.end()
  logger.once('finish', () => { process.exitCode = 1 })
})
