import express from 'express'
import mongoose from 'mongoose'
import { config } from './config/env.config.js'
import ordersRouter from './routes/orders.router.js'
import productsRouter from './routes/products.router.js'
import usersRouter from './routes/users.router.js'

const app = express()
app.use(express.json())

await mongoose.connect(config.mongoUri)
console.log('Mongo conectado')

app.use('/api/orders', ordersRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)

// Middleware de errores provisorio. En el Módulo 3 se reemplaza por la capa centralizada.
app.use((error, req, res, next) => {
  if (error.name === 'CastError') {
    return res.status(400).json({ status: 'error', error: { code: 'INVALID_ID', message: 'El id no es válido' } })
  }
  const status = error.status || 500
  const code = status === 500 ? 'INTERNAL_ERROR' : error.message
  if (status === 500) console.error(error)
  res.status(status).json({ status: 'error', error: { code, message: error.message } })
})

app.listen(config.port, () => console.log(`ShipNow en puerto ${config.port} (${config.nodeEnv})`))
