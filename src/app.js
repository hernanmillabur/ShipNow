import express from 'express'
import { setServers } from 'node:dns'
import mongoose from 'mongoose'
import { config } from './config/env.config.js'
import ordersRouter from './routes/orders.router.js'
import productsRouter from './routes/products.router.js'
import mocksRouter from './routes/mocks.router.js'
import usersRouter from './routes/users.router.js'
import loggingRouter from './routes/logging.router.js'
import deliveriesRouter from './routes/deliveries.router.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import {
  requestLoggerMiddleware,
  requestTimingMiddleware,
} from './middlewares/request-logger.middleware.js'
import { logger, safeErrorMetadata } from './logging/logger.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.config.js'

setServers(['1.1.1.1'])

const app = express()
app.use(requestTimingMiddleware)
app.use(express.json())
app.use(requestLoggerMiddleware)

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/orders', ordersRouter)
app.use('/api/deliveries', deliveriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/mocks', mocksRouter)
app.use('/api/logging', loggingRouter)
app.use(errorMiddleware)

const connectMongo = async () => {
  try {
    await mongoose.connect(config.mongoUri)
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

const server = app.listen(config.port, () => {
  logger.info('ShipNow HTTP server listening', {
    event: 'server.listening',
    port: config.port,
    nodeEnv: config.nodeEnv,
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
