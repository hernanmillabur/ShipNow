import express from 'express'
import mongoose from 'mongoose'
import ordersRouter from './routes/orders.router.js'
import productsRouter from './routes/products.router.js'
import mocksRouter from './routes/mocks.router.js'
import usersRouter from './routes/users.router.js'
import loggingRouter from './routes/logging.router.js'
import deliveriesRouter from './routes/deliveries.router.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { notFoundMiddleware } from './middlewares/not-found.middleware.js'
import {
  requestLoggerMiddleware,
  requestTimingMiddleware,
} from './middlewares/request-logger.middleware.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.config.js'
import { config } from './config/env.config.js'
import { DomainError } from './errors/domain-error.js'

const app = express()
app.use(requestTimingMiddleware)
app.use(express.json())
app.use(requestLoggerMiddleware)

app.use('/api/docs', (req, _res, next) => (
  config.swaggerEnabled ? next() : next(new DomainError('ROUTE_NOT_FOUND'))
), swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1
  return res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})
app.use('/api/orders', ordersRouter)
app.use('/api/deliveries', deliveriesRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/mocks', (req, _res, next) => {
  if (config.nodeEnv === 'production') return next(new DomainError('ROUTE_NOT_FOUND'))
  return next()
}, mocksRouter)
app.use('/api/logging', loggingRouter)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app
