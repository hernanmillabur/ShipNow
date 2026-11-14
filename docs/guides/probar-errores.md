# Probar errores funcionales

Esta guía muestra solicitudes que activan errores implementados por ShipNow. Los ejemplos presuponen que el servidor está iniciado y que las operaciones persistentes tienen acceso a MongoDB. No incluyas credenciales reales en los ejemplos ni en solicitudes compartidas.

ShipNow todavía no implementa autenticación ni autorización, por lo que no existen errores runtime `401`/`403` ni códigos de catálogo para ellos. Las rutas de carga no verifican propiedad de User o asignación de Delivery; no pruebes con documentos reales ni consideres estas rutas protegidas.

Los errores gestionados por el middleware global tienen esta estructura:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_ID",
    "message": "El identificador no es válido."
  }
}
```

## Datos incompletos

Un pedido requiere `userId`, `storeId`, `address` y al menos un `item` con `price` y `quantity`. Un body vacío se rechaza antes de consultar la base.

```bash
curl -i -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Esperado:** HTTP `400`, código `VALIDATION_ERROR`, mensaje `Los datos enviados no son válidos.`

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos."
  }
}
```

## ID con formato inválido

```bash
curl -i http://localhost:8080/api/orders/no-es-un-id
```

**Esperado:** HTTP `400`, código `INVALID_ID`, mensaje `El identificador no es válido.` La misma familia de error se aplica cuando Mongoose recibe un ID con formato inválido en otras rutas que consultan por ID.

## Recurso inexistente

El ejemplo usa un ObjectId bien formado que normalmente no corresponde a un pedido. Comprueba que no exista en el entorno antes de usar un ID propio.

```bash
curl -i http://localhost:8080/api/orders/000000000000000000000000
```

**Esperado:** HTTP `404`, código `ORDER_NOT_FOUND`, mensaje `Pedido no encontrado.`

## Estado inválido

`PATCH /api/orders/:id/deliver` rechaza un pedido cuyo estado ya sea `delivered`. Primero crea un usuario y una tienda con las rutas documentadas en la [referencia de API](../api-reference.md). Usa los IDs devueltos en un pedido pendiente, por ejemplo:

```bash
curl -i -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"userId":"ID_DEL_USUARIO","storeId":"ID_DE_LA_TIENDA","address":"Calle de prueba 10","items":[{"name":"Caja","price":12.5,"quantity":2}]}'
```

Con el ID del pedido creado, realiza el PATCH una vez para entregarlo y repite la misma solicitud:

```bash
curl -i -X PATCH http://localhost:8080/api/orders/ID_DEL_PEDIDO/deliver
```

La primera solicitud responde HTTP `200`. La segunda responde HTTP `400`, código `INVALID_STATE`, mensaje `El estado actual no permite esta operación.`

## Cantidad de mocks inválida

```bash
curl -i 'http://localhost:8080/api/mocks/users?qty=0'
```

**Esperado:** HTTP `400`, código `INVALID_MOCK_QUANTITY`, mensaje `La cantidad debe ser un entero entre 1 y 100.` El mismo rango se aplica a los GET de mocks y al seed.

## Ruta inexistente

```bash
curl -i http://localhost:8080/api/ruta-que-no-existe
```

**Esperado:** HTTP `404`, código `ROUTE_NOT_FOUND`, mensaje `Ruta no encontrada.` El middleware de fallback envía este error al middleware global.

```json
{
  "status": "error",
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ruta no encontrada."
  }
}
```

## Logger deshabilitado en production

Con el servidor iniciado con `NODE_ENV=production`, la ruta de diagnóstico está deshabilitada:

```bash
curl -i http://localhost:8080/api/logging/test
```

**Esperado:** HTTP `404` con el error JSON centralizado:

```json
{
  "status": "error",
  "error": {
    "code": "LOGGER_TEST_DISABLED",
    "message": "Ruta no encontrada."
  }
}
```

La ruta emite los niveles de prueba únicamente en `development` y `test`. En production no genera los seis eventos de diagnóstico.

## Errores de carga de archivos

Los siguientes errores usan el envelope global `{ "status": "error", "error": { "code": "...", "message": "..." } }`:

| HTTP | Código | Situación |
|---:|---|---|
| 400 | `FILE_REQUIRED` | Falta el campo `file`. |
| 400 | `INVALID_DOCUMENT_TYPE` | El `documentType` de User no está permitido. |
| 400 | `UNEXPECTED_FILE_FIELD` | El nombre del campo multipart es inesperado. |
| 400 | `INVALID_ID` | El ID de User o Delivery no tiene 24 caracteres hexadecimales. |
| 404 | `USER_NOT_FOUND` / `DELIVERY_NOT_FOUND` | No existe la entidad indicada. |
| 413 | `FILE_TOO_LARGE` | Se excede 5 MiB para documentos o 10 MiB para comprobantes. |
| 415 | `INVALID_FILE_TYPE` | MIME, extensión o firma de contenido no permitidos/coincidentes. |
| 500 | `FILE_STORAGE_FAILED` | Fallo al crear o leer el archivo almacenado. |
| 500 | `FILE_METADATA_SAVE_FAILED` | Fallo al persistir los metadatos en MongoDB. |

Un fallo posterior a la escritura intenta eliminar el archivo nuevo. Ejemplos de llamadas y campos multipart están en la [guía para subir archivos](subir-archivos.md).
