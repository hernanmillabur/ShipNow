import express from 'express'
import { setServers } from 'node:dns'
import mongoose from 'mongoose'
import { config } from './config/env.config.js'
import ordersRouter from './routes/orders.router.js'
import productsRouter from './routes/products.router.js'
import mocksRouter from './routes/mocks.router.js'
import usersRouter from './routes/users.router.js'
import { errorMiddleware } from './middlewares/error.middleware.js'

setServers(['1.1.1.1'])

const app = express()
app.use(express.json())

app.use('/api/orders', ordersRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/mocks', mocksRouter)
app.use(errorMiddleware)

app.listen(config.port, () => console.log(`ShipNow en puerto ${config.port} (${config.nodeEnv})`))

const connectMongo = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('Mongo conectado')
  } catch (error) {
    console.error(`Mongo no disponible; nuevo intento en 5 segundos: ${error.message}`)
    setTimeout(connectMongo, 5000)
  }
}

void connectMongo()
