import express from 'express'
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
app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app
