# ShipNow v2

API de gestión de productos, usuarios, tiendas, pedidos y entregas construida con Node.js, Express y MongoDB mediante Mongoose.

## Arquitectura

Las solicitudes siguen el flujo **Controller → Service → Repository**:

- **Controller**: adapta HTTP a llamadas de aplicación; lee `req`, invoca servicios y construye respuestas. No contiene consultas MongoDB.
- **Service**: aplica reglas de negocio y coordina repositorios. No depende de Express ni de Mongoose.
- **Repository**: encapsula las consultas Mongoose y el acceso a los modelos.

Separar Service y Repository permite cambiar o probar las reglas de negocio sin mezclarlas con detalles de persistencia; también concentra las consultas para que los controladores y servicios no dependan directamente de Mongoose.

La configuración se carga y valida centralmente en `src/config/env.config.js`. Las constantes de dominio están en `src/constants/index.js`.

## Estructura

```text
src/
|-- app.js
|-- config/
|   |-- env.config.js
|   `-- swagger.config.js
|-- constants/
|   `-- index.js
|-- controllers/
|   |-- deliveries.controller.js
|   |-- logging.controller.js
|   |-- mocks.controller.js
|   |-- orders.controller.js
|   |-- products.controller.js
|   `-- users.controller.js
|-- docs/
|   |-- paths/
|   |   |-- deliveries.docs.js
|   |   |-- logger.docs.js
|   |   |-- mocks.docs.js
|   |   |-- orders.docs.js
|   |   |-- products.docs.js
|   |   `-- users.docs.js
|   `-- schemas/
|       `-- index.js
|-- errors/
|   |-- domain-error.js
|   `-- error-catalog.js
|-- logging/
|   `-- logger.js
|-- middlewares/
|   |-- error.middleware.js
|   `-- request-logger.middleware.js
|-- models/
|   |-- delivery.model.js
|   |-- order.model.js
|   |-- product.model.js
|   |-- store.model.js
|   `-- user.model.js
|-- repositories/
|   |-- deliveries.repository.js
|   |-- orders.repository.js
|   |-- products.repository.js
|   |-- stores.repository.js
|   `-- users.repository.js
|-- routes/
|   |-- deliveries.router.js
|   |-- logging.router.js
|   |-- mocks.router.js
|   |-- orders.router.js
|   |-- products.router.js
|   `-- users.router.js
`-- services/
    |-- deliveries.service.js
    |-- mocks.service.js
    |-- orders.service.js
    |-- products.service.js
    `-- users.service.js
```

## Instalación y configuración

Requiere Node.js y una instancia accesible de MongoDB.

```bash
npm install
cp .env.example .env
```

Configura `.env`:

```dotenv
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
JWT_SECRET=
NODE_ENV=development
```

`PORT`, `MONGODB_URI` y `NODE_ENV` son obligatorias. `PORT` debe ser un entero entre 1 y 65535; `NODE_ENV` debe ser `development`, `production` o `test`. `JWT_SECRET` se conserva como variable opcional y no se usa actualmente en esta API. No publiques secretos ni el archivo `.env`.

## Ejecución local

```bash
npm run dev
```

Para iniciar sin modo watch:

```bash
npm start
```

## Endpoints

Las respuestas exitosas usan `{ "status": "success", "payload": ... }`. Los errores se envían al middleware de errores de la aplicación.

### Products

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista productos |
| GET | `/api/products/:id` | Obtiene un producto |
| POST | `/api/products` | Crea un producto (`name`, `description`, `price`, `stock`) |
| PUT | `/api/products/:id` | Actualiza datos del producto |
| DELETE | `/api/products/:id` | Elimina un producto |

El estado se deriva del stock: `available` cuando es mayor que cero y `out_of_stock` cuando es cero. Precio y stock no pueden ser negativos; el stock debe ser entero.

### Users y Stores

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/users` | Crea un usuario |
| GET | `/api/users` | Lista usuarios |
| POST | `/api/users/stores` | Crea una tienda |

### Orders

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/orders` | Crea un pedido |
| GET | `/api/orders` | Lista pedidos |
| GET | `/api/orders/:id` | Obtiene un pedido |
| PATCH | `/api/orders/:id/deliver` | Marca un pedido como entregado |

### Deliveries

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/deliveries` | Crea una entrega y asigna un repartidor |

El body requiere `orderId` y `driverId`. El pedido debe existir y el usuario indicado por `driverId` debe existir y tener rol `driver`.

### Mocks de la segunda pre-entrega

Los GET generan datos simulados en memoria y no los guardan en MongoDB. `qty` debe ser un entero entre 1 y 100; si se omite, cada endpoint usa la cantidad predeterminada indicada.

```bash
# Genera 2 clientes y 2 repartidores ficticios (predeterminado: 2)
curl "http://localhost:8080/api/mocks/users?qty=2"

# Genera pedidos ficticios junto a sus clientes y tiendas relacionados (predeterminado: 5)
curl "http://localhost:8080/api/mocks/orders?qty=5"

# Genera clientes, repartidores, tiendas, pedidos y entregas relacionadas (predeterminado: 5)
curl "http://localhost:8080/api/mocks/deliveries?qty=5"

# Inserta en MongoDB usuarios, tiendas, pedidos y entregas relacionados (predeterminado: 10)
curl -X POST "http://localhost:8080/api/mocks/seed?qty=10"
```

## Manejo de errores

Los errores se responden únicamente desde el middleware global, con el mismo formato:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "La cantidad debe ser un entero entre 1 y 100."
  }
}
```

El código, mensaje y estado HTTP salen del catálogo central de errores. Los errores inesperados se registran en el servidor y se responden al cliente con un mensaje genérico, sin detalles internos.

Prueba algunos errores desde la terminal:

```bash
# Cantidad negativa: HTTP 400, INVALID_MOCK_QUANTITY
curl -i "http://localhost:8080/api/mocks/users?qty=-2"

# Cantidad fuera del rango permitido: HTTP 400, INVALID_MOCK_QUANTITY
curl -i "http://localhost:8080/api/mocks/orders?qty=101"

# ID con formato inválido: HTTP 400, INVALID_ID
curl -i "http://localhost:8080/api/orders/no-es-un-id"

# Pedido con formato de ID válido pero inexistente: HTTP 404, ORDER_NOT_FOUND
curl -i "http://localhost:8080/api/orders/000000000000000000000000"

# Fallo durante el seed (por ejemplo, MongoDB no disponible): HTTP 500, MOCK_SEED_FAILED
curl -i -X POST "http://localhost:8080/api/mocks/seed?qty=1"
```

En un fallo de seed, el cliente recibe el código estable `MOCK_SEED_FAILED`; la causa original se conserva y se registra únicamente en el servidor para depuración.

El POST crea clientes y repartidores con sus roles correspondientes, luego tiendas, pedidos y entregas. Cada entrega referencia un pedido y un usuario cuyo rol es `DRIVER`. Las cantidades no numéricas, fraccionarias, menores que 1 o mayores que 100 se rechazan con HTTP 400.

## Logging y monitoreo básico

ShipNow usa Winston para centralizar los registros de solicitudes HTTP, eventos de inicio y conexión a MongoDB, cargas de mocks y errores. Los registros estructurados incluyen timestamp, nivel y mensaje. Se filtran campos sensibles como contraseñas, tokens y URI de MongoDB.

Niveles configurados: `fatal`, `error`, `warning`, `info`, `http` y `debug`. `fatal` identifica una falla crítica de inicio; la prueba del logger lo emite solo como evento simulado.

El umbral depende de `NODE_ENV`:

- `development`: `debug`, habilita los seis niveles.
- `test`: `debug`, habilita los seis niveles.
- `production`: `info`, conserva eventos operacionales y solicitudes HTTP, y omite `debug`.

Los registros de cada entorno se guardan de forma independiente en `logs/development/`, `logs/test/` y `logs/production/`. Cada carpeta tiene `combined.log` para los registros habilitados y `error.log`, que almacena exclusivamente los niveles `error` y `fatal`. Winston agrega la fecha al nombre de los archivos rotados.

Los archivos rotan diariamente, tienen un límite de 20 MB y se conservan durante 14 días. La carpeta `logs/` está excluida de Git mediante `.gitignore`.

Ejemplo de la estructura de archivos fechados:

```text
logs/
|-- development/
|   |-- combined.log.YYYY-MM-DD
|   `-- error.log.YYYY-MM-DD
|-- test/
|   |-- combined.log.YYYY-MM-DD
|   `-- error.log.YYYY-MM-DD
`-- production/
    |-- combined.log.YYYY-MM-DD
    `-- error.log.YYYY-MM-DD
```

En desarrollo o test, prueba los seis niveles con:

```bash
curl -i "http://localhost:8080/api/logging/test"
```

La respuesta exitosa indica los niveles emitidos. En `production`, la ruta responde con el error controlado `404 LOGGER_TEST_DISABLED`; el nivel fatal de prueba nunca termina el proceso.

## Documentación de API con Swagger

ShipNow publica una especificación OpenAPI 3.0.3 y una interfaz Swagger UI para consultar y probar las rutas disponibles:

```text
http://localhost:8080/api/docs
```

Levanta la API con `npm run dev` (o `npm start`) después de configurar `.env` y asegurar que MongoDB esté disponible para las operaciones persistentes. La integración usa las dependencias instaladas `swagger-jsdoc` para generar OpenAPI y `swagger-ui-express` para servir Swagger UI. La configuración está separada de los routers en `src/config/swagger.config.js`; los schemas reutilizables y las definiciones de cada módulo están en `src/docs/`.

La documentación organiza la API por los tags Users, Orders, Deliveries, Mocks, Logger y Products. Incluye schemas reutilizables para usuarios, tiendas, pedidos, ítems, entregas, productos y respuestas exitosas o de error. Las rutas y respuestas documentadas corresponden a los endpoints implementados; no se declara autenticación.

En Swagger UI, abre el módulo y la operación que quieres probar, selecciona **Try it out**, completa los parámetros o el body y pulsa **Execute**. Las rutas que consultan o escriben MongoDB requieren conexión y registros relacionados cuando corresponda.

Los GET de `/api/mocks/users`, `/api/mocks/orders` y `/api/mocks/deliveries` generan datos en memoria y no los guardan. Para cargar datos, se recomienda enviar la cantidad en JSON:

```bash
curl -i -X POST "http://localhost:8080/api/mocks/seed" \
  -H "Content-Type: application/json" \
  -d '{"qty":10}'
```

Seed también acepta `qty` en query para mantener compatibilidad, por ejemplo `/api/mocks/seed?qty=10`; si body y query incluyen `qty`, prevalece el body. La cantidad debe ser un entero entre 1 y 100 y usa 10 como valor predeterminado. **Seed inserta clientes, repartidores, tiendas, pedidos y entregas en MongoDB; no lo ejecutes en una base compartida o real sin revisar antes sus efectos.**

`POST /api/deliveries` crea una entrega persistente y requiere que MongoDB tenga un pedido existente y un usuario existente con rol `driver`. Puedes crear los registros relacionados con los endpoints documentados de Users y Orders. `GET /api/logging/test` es una ruta de prueba del logger: emite los seis niveles configurados, simula `fatal` sin terminar el proceso, y solo está disponible en development y test.
