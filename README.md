# ShipNow v2

API de gestión de productos, usuarios, tiendas y pedidos construida con Node.js, Express y MongoDB mediante Mongoose.

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
├── app.js
├── config/
│   └── env.config.js
├── constants/
│   └── index.js
├── controllers/
│   ├── orders.controller.js
│   ├── mocks.controller.js
│   ├── products.controller.js
│   └── users.controller.js
├── models/
│   ├── order.model.js
│   ├── delivery.model.js
│   ├── product.model.js
│   ├── store.model.js
│   └── user.model.js
├── repositories/
│   ├── orders.repository.js
│   ├── deliveries.repository.js
│   ├── products.repository.js
│   ├── stores.repository.js
│   └── users.repository.js
├── routes/
│   ├── orders.router.js
│   ├── mocks.router.js
│   ├── products.router.js
│   └── users.router.js
└── services/
    ├── orders.service.js
    ├── deliveries.service.js
    ├── mocks.service.js
    ├── products.service.js
    └── users.service.js
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
