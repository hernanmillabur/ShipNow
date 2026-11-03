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
│   ├── products.controller.js
│   └── users.controller.js
├── models/
│   ├── order.model.js
│   ├── product.model.js
│   ├── store.model.js
│   └── user.model.js
├── repositories/
│   ├── orders.repository.js
│   ├── products.repository.js
│   ├── stores.repository.js
│   └── users.repository.js
├── routes/
│   ├── orders.router.js
│   ├── products.router.js
│   └── users.router.js
└── services/
    ├── orders.service.js
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
