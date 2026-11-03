import dotenv from 'dotenv'

dotenv.config()

const required = (name) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta la variable de entorno requerida: ${name}`)
  return value
}

const rawPort = required('PORT')
if (!/^\d+$/.test(rawPort)) {
  throw new Error('La variable PORT debe ser un número entero entre 1 y 65535')
}
const port = Number(rawPort)
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error('La variable PORT debe ser un número entero entre 1 y 65535')
}

const mongoUri = required('MONGODB_URI')
const nodeEnv = required('NODE_ENV')
if (!['development', 'production', 'test'].includes(nodeEnv)) {
  throw new Error('La variable NODE_ENV debe ser development, production o test')
}

export const config = Object.freeze({
  port,
  mongoUri,
  nodeEnv,
  // JWT no se consume en esta entrega; se conserva como opcional para usos futuros.
  ...(process.env.JWT_SECRET?.trim() ? { jwtSecret: process.env.JWT_SECRET.trim() } : {}),
})
