import dotenv from 'dotenv'
import { isAbsolute, resolve } from 'node:path'

dotenv.config()

const required = (name, source = process.env) => {
  const value = source[name]?.trim()
  if (!value) throw new Error(`Falta la variable de entorno requerida: ${name}`)
  return value
}

const readPort = (source = process.env) => {
  const rawPort = required('PORT', source)
  if (!/^\d+$/.test(rawPort)) {
    throw new Error('La variable PORT debe ser un número entero entre 1 y 65535')
  }
  const port = Number(rawPort)
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('La variable PORT debe ser un número entero entre 1 y 65535')
  }
  return port
}

const readNodeEnv = (source = process.env) => {
  const nodeEnv = required('NODE_ENV', source)
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('La variable NODE_ENV debe ser development, production o test')
  }
  return nodeEnv
}

const readBoolean = (name, fallback) => {
  const raw = process.env[name]?.trim().toLowerCase()
  if (raw === undefined || raw === '') return fallback
  if (raw === 'true') return true
  if (raw === 'false') return false
  throw new Error(`La variable ${name} debe ser true o false`)
}

const validLogLevels = ['fatal', 'error', 'warning', 'http', 'info', 'debug']

export const validateConfig = (source = process.env) => {
  const port = readPort(source)
  const mongoUri = required('MONGODB_URI', source)
  const nodeEnv = readNodeEnv(source)
  const logLevel = source.LOG_LEVEL?.trim() || (nodeEnv === 'production' ? 'info' : 'debug')
  if (!validLogLevels.includes(logLevel)) throw new Error('La variable LOG_LEVEL no es válida')
  const swaggerRaw = source.SWAGGER_ENABLED?.trim().toLowerCase()
  const logToFileRaw = source.LOG_TO_FILE?.trim().toLowerCase()
  const readSourceBoolean = (name, raw, fallback) => {
    if (raw === undefined || raw === '') return fallback
    if (raw === 'true') return true
    if (raw === 'false') return false
    throw new Error(`La variable ${name} debe ser true o false`)
  }
  const uploadsDir = source.UPLOADS_DIR?.trim() || undefined
  return Object.freeze({
    port, mongoUri, nodeEnv, logLevel,
    uploadsDir: uploadsDir ? resolve(isAbsolute(uploadsDir) ? uploadsDir : resolve(process.cwd(), uploadsDir)) : undefined,
    swaggerEnabled: readSourceBoolean('SWAGGER_ENABLED', swaggerRaw, nodeEnv !== 'production'),
    logToFile: readSourceBoolean('LOG_TO_FILE', logToFileRaw, false),
  })
}

export const config = Object.freeze({
  get port() { return readPort() },
  get mongoUri() { return required('MONGODB_URI') },
  get nodeEnv() { return readNodeEnv() },
  get logLevel() {
    const level = process.env.LOG_LEVEL?.trim() || (this.nodeEnv === 'production' ? 'info' : 'debug')
    if (!validLogLevels.includes(level)) throw new Error('La variable LOG_LEVEL no es válida')
    return level
  },
  get swaggerEnabled() { return readBoolean('SWAGGER_ENABLED', this.nodeEnv !== 'production') },
  get logToFile() { return readBoolean('LOG_TO_FILE', false) },
  get uploadsDir() {
    const value = process.env.UPLOADS_DIR?.trim()
    return value ? resolve(isAbsolute(value) ? value : resolve(process.cwd(), value)) : undefined
  },
  // JWT no se consume en esta entrega; se conserva como opcional para usos futuros.
  ...(process.env.JWT_SECRET?.trim() ? { jwtSecret: process.env.JWT_SECRET.trim() } : {}),
})
