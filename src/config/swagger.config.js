import swaggerJSDoc from 'swagger-jsdoc'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { schemas } from '../docs/schemas/index.js'

const configDirectory = dirname(fileURLToPath(import.meta.url))

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ShipNow API',
      version: '2.0.0',
      description: 'API para gestionar usuarios, tiendas, productos, pedidos y entregas de ShipNow.',
    },
    servers: [{ url: 'http://localhost:8080', description: 'Servidor local' }],
    tags: [
      { name: 'Users', description: 'Usuarios y creación de tiendas.' },
      { name: 'Orders', description: 'Creación y consulta de pedidos.' },
      { name: 'Deliveries', description: 'Asignación de repartidores a pedidos.' },
      { name: 'Mocks', description: 'Generación en memoria y carga de datos de prueba.' },
      { name: 'Logger', description: 'Validación de los niveles de logging.' },
      { name: 'Products', description: 'Administración de productos.' },
    ],
    components: { schemas },
  },
  apis: [resolve(configDirectory, '../docs/paths/*.docs.js').replaceAll('\\', '/')],
  failOnErrors: true,
}

export const swaggerSpec = swaggerJSDoc(options)
