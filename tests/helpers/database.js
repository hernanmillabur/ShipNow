import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MONGODB_BINARY_VERSION = '8.0.34'
const TEST_DATABASE_NAME = 'shipnow_test'
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

let mongoServer

const assertIsTemporaryLocalUri = (uri) => {
  const parsed = new URL(uri)
  if (
    parsed.protocol !== 'mongodb:'
    || !LOCAL_HOSTS.has(parsed.hostname.toLowerCase())
    || parsed.username
    || parsed.password
    || parsed.pathname !== `/${TEST_DATABASE_NAME}`
  ) {
    throw new Error('MongoDB de testing debe ser local y utilizar la base shipnow_test')
  }
}

export const startTestDatabase = async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: MONGODB_BINARY_VERSION,
      downloadDir: join(tmpdir(), 'shipnow-mongodb-binaries'),
    },
    instance: { dbName: TEST_DATABASE_NAME },
  })

  const uri = mongoServer.getUri(TEST_DATABASE_NAME)
  assertIsTemporaryLocalUri(uri)

  try {
    await mongoose.connect(uri)
    return uri
  } catch (error) {
    await mongoServer.stop()
    mongoServer = undefined
    throw error
  }
}

export const clearTestDatabase = async () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('La base MongoDB temporal no está conectada')
  }

  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
}

export const stopTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
  } finally {
    if (mongoServer) {
      const serverToStop = mongoServer
      const stopped = await serverToStop.stop()
      if (!stopped || serverToStop.instanceInfo !== undefined) {
        throw new Error('MongoDB temporal no se detuvo y limpió correctamente')
      }
      mongoServer = undefined
    }
  }

  if (mongoose.connection.readyState !== 0) {
    throw new Error('Mongoose continúa conectado después del cierre del entorno de testing')
  }
}
