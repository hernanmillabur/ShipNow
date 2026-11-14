# Referencia de API

La especificación OpenAPI 3.0.3 y Swagger UI están disponibles en [`/api/docs/`](http://localhost:8080/api/docs/) cuando ShipNow está iniciado. Esta página resume los contratos declarados en `src/docs/paths/` y `src/docs/schemas/`; la especificación es la referencia completa.

Las rutas persistentes requieren una conexión MongoDB y los registros relacionados que indique cada operación. Las respuestas exitosas usan `{ "status": "success", "payload": ... }`. Los errores gestionados usan `{ "status": "error", "error": { "code": ..., "message": ... } }`.

## Users y Stores

| Método | Ruta | Body | Éxito | Errores documentados |
|---|---|---|---|---|
| `GET` | `/api/users` | — | `200`; `payload` es una lista de usuarios. | `500 INTERNAL_ERROR` |
| `POST` | `/api/users` | `name` y `email` requeridos; `role` opcional (`admin`, `user`, `customer`, `driver`, `store`; predeterminado `customer`). | `201`; `payload` es el usuario creado. | `400 VALIDATION_ERROR` o `INVALID_REQUEST`; `409 DUPLICATE_RESOURCE`; `500 INTERNAL_ERROR` |
| `POST` | `/api/users/stores` | `name` requerido; `address` opcional. | `201`; `payload` es la tienda creada. | `400 VALIDATION_ERROR` o `INVALID_REQUEST`; `500 INTERNAL_ERROR` |

## Products

El `status` de un producto se deriva del stock: `available` si es mayor que cero y `out_of_stock` si es cero. No se envía en el body de creación o actualización.

| Método | Ruta | Body o parámetros | Éxito | Errores documentados |
|---|---|---|---|---|
| `GET` | `/api/products` | — | `200`; lista de productos. | `500 INTERNAL_ERROR` |
| `GET` | `/api/products/{id}` | `id`: ObjectId de 24 caracteres hexadecimales. | `200`; producto. | `400 INVALID_ID`; `404 PRODUCT_NOT_FOUND`; `500 INTERNAL_ERROR` |
| `POST` | `/api/products` | `name` no vacío, `price` número ≥ 0 y `stock` entero ≥ 0 requeridos; `description` opcional string. No se permiten propiedades adicionales. | `201`; producto creado. | `400 INVALID_PRODUCT_FIELD`, `INVALID_PRODUCT_NAME`, `INVALID_PRODUCT_PRICE`, `INVALID_PRODUCT_STOCK`, `INVALID_PRODUCT_DESCRIPTION`, `VALIDATION_ERROR` o `INVALID_REQUEST`; `500 INTERNAL_ERROR` |
| `PUT` | `/api/products/{id}` | `id` de 24 caracteres hexadecimales; body acepta un subconjunto de `name`, `description`, `price`, `stock`. Se validan con las mismas reglas cuando están presentes. | `200`; producto actualizado. | `400 INVALID_ID`, los códigos de validación de producto anteriores, `VALIDATION_ERROR` o `INVALID_REQUEST`; `404 PRODUCT_NOT_FOUND`; `500 INTERNAL_ERROR` |
| `DELETE` | `/api/products/{id}` | `id`: ObjectId de 24 caracteres hexadecimales. | `204`; sin body. | `400 INVALID_ID`; `404 PRODUCT_NOT_FOUND`; `500 INTERNAL_ERROR` |

## Orders

Para crear un pedido, `userId` y `storeId` deben referenciar registros existentes. El total se calcula desde los ítems; el estado inicial es `pending` y la prioridad predeterminada es `normal`.

| Método | Ruta | Body o parámetros | Éxito | Errores documentados |
|---|---|---|---|---|
| `GET` | `/api/orders` | — | `200`; lista de pedidos. | `500 INTERNAL_ERROR` |
| `POST` | `/api/orders` | `userId`, `storeId` (ObjectIds), `address` no vacío y `items` no vacío requeridos. Cada ítem requiere `price` y `quantity` numéricos; `name` es opcional string. `priority` opcional: `low`, `normal` o `high`. No se documentan límites de mínimo o enteros para precio/cantidad. | `201`; pedido creado. | `400 INVALID_ID`, `VALIDATION_ERROR` o `INVALID_REQUEST`; `404 USER_NOT_FOUND` o `STORE_NOT_FOUND`; `500 INTERNAL_ERROR` |
| `GET` | `/api/orders/{id}` | `id`: ObjectId de 24 caracteres hexadecimales. | `200`; pedido. | `400 INVALID_ID`; `404 ORDER_NOT_FOUND`; `500 INTERNAL_ERROR` |
| `PATCH` | `/api/orders/{id}/deliver` | `id`: ObjectId de 24 caracteres hexadecimales; sin body. | `200`; pedido actualizado a `delivered`. | `400 INVALID_ID` o `INVALID_STATE`; `404 ORDER_NOT_FOUND`; `500 INTERNAL_ERROR` |

## Deliveries

`POST /api/deliveries` requiere un `orderId` existente y un `driverId` que identifique un usuario existente con rol `driver`. El modelo inicia `status` en `pending` si se omite; el contrato también permite enviar un estado enumerado.

| Método | Ruta | Body | Éxito | Errores documentados |
|---|---|---|---|---|
| `POST` | `/api/deliveries` | `orderId` y `driverId` requeridos. `status` opcional: `pending`, `in_transit`, `delivered`; `assignedAt` opcional date-time; `deliveredAt` opcional date-time o `null`. | `201`; entrega creada. | `400 INVALID_ID`, `INVALID_DRIVER_ROLE`, `VALIDATION_ERROR` o `INVALID_REQUEST`; `404 ORDER_NOT_FOUND` o `DRIVER_NOT_FOUND`; `500 INTERNAL_ERROR` |

## Mocks

Los GET generan estructuras en memoria y no las guardan. En los tres, `qty` es un entero entre 1 y 100; cada endpoint usa su valor predeterminado si se omite.

| Método | Ruta | Parámetro/body | Éxito | Errores documentados |
|---|---|---|---|---|
| `GET` | `/api/mocks/users` | Query `qty`, predeterminado `2`. | `200`; `payload` contiene `customers` y `drivers`, cada lista con `qty` elementos. | `400 INVALID_MOCK_QUANTITY`; `500 INTERNAL_ERROR` |
| `GET` | `/api/mocks/orders` | Query `qty`, predeterminado `5`. | `200`; `payload` contiene `customers`, `stores` y `orders`. | `400 INVALID_MOCK_QUANTITY`; `500 INTERNAL_ERROR` |
| `GET` | `/api/mocks/deliveries` | Query `qty`, predeterminado `5`. | `200`; `payload` contiene customers, drivers, stores, orders y deliveries relacionados. | `400 INVALID_MOCK_QUANTITY`; `500 INTERNAL_ERROR` |
| `POST` | `/api/mocks/seed` | `qty` opcional en JSON o query, predeterminado `10`, entero de 1 a 100. Si ambos están presentes, prevalece el body. | `201`; inserta customers, drivers, stores, orders y deliveries relacionados. | `400 INVALID_MOCK_QUANTITY`; `500 MOCK_SEED_FAILED` |

## Logger

| Método | Ruta | Condición | Éxito | Error |
|---|---|---|---|---|
| `GET` | `/api/logging/test` | Disponible en `development` y `test`; no requiere body ni parámetros. | `200`; `payload.levels`: `debug`, `http`, `info`, `warning`, `error`, `fatal`. El evento `fatal` es simulado. | En `production`: `404 LOGGER_TEST_DISABLED`. |

## Swagger UI

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/docs/` | `200`; interfaz HTML de Swagger UI. No usa el envelope JSON de la API. |

No se declara autenticación en la especificación OpenAPI actual. Una ruta no registrada responde HTTP `404` con `ROUTE_NOT_FOUND` y el envelope JSON de error de ShipNow. Este fallback de Express no corresponde a un path individual en la especificación OpenAPI.
