# ShipNow v2

API REST para administrar usuarios, tiendas, productos, pedidos y entregas. Está construida con Express y MongoDB/Mongoose, y ofrece paginación, carga de archivos, logging estructurado, health check y documentación OpenAPI. El proyecto usa ES Modules.

## Stack verificado

Versiones instaladas desde `package-lock.json` en esta entrega:

| Componente | Versión |
|---|---:|
| Node.js local | 24.14.1 (rama 24.x) |
| Node.js en Docker | 24, imagen `node:24-bookworm-slim` |
| Express | 4.22.3 |
| Mongoose | 8.24.8 |
| MongoDB temporal de tests | 8.0.34 |
| Mocha / Chai / Supertest | 12.0.3 / 6.3.0 / 7.3.2 |
| Multer | 2.5.0 |
| Swagger JSDoc / Swagger UI Express | 6.3.0 / 5.0.1 |
| Winston / Daily Rotate File | 3.19.0 / 5.0.0 |

## Requisitos

- Node.js 24.x y npm.
- MongoDB accesible para ejecutar la API con datos persistentes. Los tests usan MongoDB temporal y no necesitan Atlas.
- Docker Engine/Desktop solo para el flujo opcional en contenedores.

## Instalación local

Desde la raíz del repositorio instala las versiones bloqueadas y crea tu archivo de entorno local:

```bash
npm ci
cp .env.example .env
```

PowerShell:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Configura `.env` con una instancia MongoDB local o de desarrollo antes de iniciar la API. No compartas ese archivo. La aplicación valida las tres variables requeridas y conecta a MongoDB **antes** de abrir el puerto HTTP.

### Variables de entorno

| Variable | Requerida | Descripción y valor predeterminado |
|---|---|---|
| `PORT` | Sí | Puerto HTTP entero entre 1 y 65535. El ejemplo local y Docker usan `8080`. |
| `MONGODB_URI` | Sí | URI de conexión MongoDB para el entorno. |
| `NODE_ENV` | Sí | `development`, `test` o `production`. |
| `LOG_LEVEL` | No | Nivel Winston: `fatal`, `error`, `warning`, `http`, `info`, `debug`. Predeterminado `debug` en development/test y `info` en production. |
| `UPLOADS_DIR` | No | Raíz de archivos subidos. Predeterminado `uploads/` local y `/app/data/uploads` en Docker. |
| `SWAGGER_ENABLED` | No | `true` o `false`; predeterminado habilitado en development/test y deshabilitado en production. |
| `LOG_TO_FILE` | No | `true` o `false`; predeterminado `false`. La consola queda disponible para `docker logs`. |
| `JWT_SECRET` | No | Reservada: JWT/autenticación no están implementados y la aplicación no la consume. |

No incluyas credenciales reales en documentación, comandos guardados, Dockerfile o imagen.

## Ejecutar

Modo desarrollo con reinicio al cambiar archivos:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

El servidor escucha en `PORT` y expone la API bajo `/api`. En PowerShell, npm puede invocarse como `npm.cmd` si la política local bloquea scripts `.ps1`.

## API y contratos

Swagger UI: [http://localhost:8080/api/docs/](http://localhost:8080/api/docs/). En production la ruta devuelve 404 salvo que se configure intencionalmente `SWAGGER_ENABLED=true`. La especificación OpenAPI se genera desde `src/docs/`.

Las respuestas exitosas usan `{ "status": "success", "payload": ... }`; errores gestionados usan `{ "status": "error", "error": { "code": ..., "message": ... } }`.

| Método | Ruta | Función |
|---|---|---|
| GET, POST | `/api/users` | Listar usuarios paginados / crear usuario. |
| POST | `/api/users/stores` | Crear tienda. |
| POST | `/api/users/:userId/documents` | Adjuntar documento multipart a usuario. |
| GET, POST, PUT, DELETE | `/api/products`, `/api/products/:id` | Listar, crear, actualizar y eliminar productos. |
| GET, POST | `/api/orders` | Listar pedidos paginados / crear pedido. |
| GET | `/api/orders/:id` | Consultar pedido. |
| PATCH | `/api/orders/:id/deliver` | Marcar pedido entregado. |
| POST | `/api/deliveries` | Crear entrega. |
| POST | `/api/deliveries/:deliveryId/proof` | Adjuntar comprobante multipart. |
| GET | `/api/health` | Estado de servicio y conexión MongoDB. |
| GET | `/api/mocks/users`, `/api/mocks/orders`, `/api/mocks/deliveries` | Generar datos de ejemplo en memoria. |
| POST | `/api/mocks/seed` | Insertar datos de ejemplo relacionados. |
| GET | `/api/logging/test` | Emitir eventos de prueba en development/test. |

Los mocks y `/api/logging/test` están deshabilitados en production. Health permanece habilitado y devuelve HTTP 200 con `status: "ok"` cuando Mongoose está conectado; si no, HTTP 503 y `status: "unavailable"`. No expone URI ni credenciales.

### Listados paginados

Orders, Users y Products aceptan `page` (entero positivo, default `1`) y `limit` (1–100, default `20`). La respuesta incluye `payload.items` y `payload.pagination` (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, `hasPreviousPage`). Los filtros permitidos dependen del recurso: Users `role`; Products `status`; Orders `status`, `priority`, `userId`, `storeId`. Filtros inválidos, parámetros desconocidos, IDs inválidos y saltos que exceden el máximo seguro se rechazan como solicitud inválida. La [referencia de API](docs/api-reference.md) detalla enums, errores y cuerpos.

### Archivos

Se aceptan PDF, JPEG y PNG. Documentos de usuario tienen límite de 5 MiB; comprobantes de entrega, 10 MiB. Los binarios se almacenan en disco (`UPLOADS_DIR`) con nombre físico UUID; MongoDB guarda metadatos y rutas relativas. La validación de firma inicial no es análisis antimalware. Usa archivos sintéticos para probar:

```bash
curl -F 'documentType=identity' -F 'file=@./sample.pdf;type=application/pdf' http://localhost:8080/api/users/USER_ID/documents
curl -F 'file=@./sample.pdf;type=application/pdf' http://localhost:8080/api/deliveries/DELIVERY_ID/proof
```

Estos endpoints no tienen autenticación ni autorización; no subas documentos o comprobantes reales. Consulta la [guía de carga](docs/guides/subir-archivos.md).

## Tests

```bash
npm test
```

En PowerShell: `npm.cmd test`. Mocha/Chai/Supertest levantan MongoDB 8.0.34 temporal mediante `mongodb-memory-server`, limpian la base entre casos y usan un directorio temporal de uploads. No inician el servidor normal ni requieren Atlas. Si el binario MongoDB no está en caché, la primera ejecución puede necesitar descargarlo. Más detalles y comandos para ejecutar un archivo están en la [guía de testing](docs/guides/testing.md).

## Health, logs y cierre

- `GET /api/health` comprueba el estado de conexión de Mongoose; Docker usa este endpoint en su healthcheck.
- Winston escribe a consola por defecto. Docker recoge stdout/stderr con `docker logs <contenedor>`.
- Con `LOG_TO_FILE=true`, se habilitan logs combinados y de errores con rotación diaria, límite de 20 MB y retención de 14 días, bajo `logs/<NODE_ENV>/` (en la imagen, `/app/logs/<NODE_ENV>/`). Persiste ese directorio si habilitas archivos en Docker.
- `SIGINT`/`SIGTERM` dejan de aceptar solicitudes, cierran HTTP, desconectan Mongoose y finalizan Winston.

## Docker

La imagen usa Node 24 slim, instala solo dependencias de producción, ejecuta como usuario no root `node`, publica el puerto 8080 y define healthcheck. MongoDB se proporciona aparte. Ejemplo de desarrollo local con una red privada Docker y volúmenes nombrados:

```bash
docker network create shipnow-net
docker volume create shipnow_mongo
docker volume create shipnow_uploads
docker run -d --name shipnow-mongo --network shipnow-net \
  -v shipnow_mongo:/data/db mongo:8
docker build -t shipnow:modulo-8 .
docker run -d --name shipnow-api --network shipnow-net -p 8080:8080 \
  -e PORT=8080 -e NODE_ENV=production \
  -e MONGODB_URI='mongodb://shipnow-mongo:27017/shipnow' \
  -v shipnow_uploads:/app/data/uploads shipnow:modulo-8
```

PowerShell:

```powershell
docker network create shipnow-net
docker volume create shipnow_mongo
docker volume create shipnow_uploads
docker run -d --name shipnow-mongo --network shipnow-net `
  -v shipnow_mongo:/data/db mongo:8
docker build -t shipnow:modulo-8 .
docker run -d --name shipnow-api --network shipnow-net -p 8080:8080 `
  -e PORT=8080 -e NODE_ENV=production `
  -e MONGODB_URI='mongodb://shipnow-mongo:27017/shipnow' `
  -v shipnow_uploads:/app/data/uploads shipnow:modulo-8
```

Ese MongoDB sin autenticación es solo para pruebas locales, dentro de una red Docker privada; no lo expongas a una red pública. En producción usa un MongoDB protegido, credenciales administradas fuera de la imagen y controles de red apropiados. Para revisar estado y registros:

```bash
docker ps
docker inspect --format='{{.State.Health.Status}}' shipnow-api
docker logs shipnow-api
```

Al actualizar la API puedes detener y eliminar/recrear el contenedor de aplicación conservando `shipnow_uploads` y la base de datos. No borres esos volúmenes, no uses `docker rm -v` ni comandos de prune si necesitas conservar los datos. La [guía Docker](docs/guides/desplegar-con-docker.md) cubre configuración y persistencia.

## Seguridad y límites conocidos

La API todavía no implementa autenticación, autorización por rol o recurso, ni antivirus. Los roles son datos y no verifican la identidad del solicitante. La comprobación de firma de archivo tampoco sustituye un análisis de contenido. Mantén el servicio detrás de controles de red y no lo expongas con datos sensibles hasta incorporar identidad, permisos y controles de carga adecuados.

## Estructura del proyecto

```text
src/
  app.js, server.js       configuración Express y arranque
  config/                 entorno, MongoDB, Multer y Swagger
  routes/ controllers/    rutas HTTP y controladores
  services/ repositories/ reglas de negocio y acceso a datos
  models/                 esquemas Mongoose e índices
  middlewares/ errors/    errores, validación y respuestas
  logging/                Winston y middleware HTTP
  docs/                   definiciones OpenAPI
  utils/                  utilidades de paginación
tests/                    suite Mocha y helpers aislados
docs/                     referencia y guías del proyecto
```

## Documentación

- [Referencia de API](docs/api-reference.md): rutas, parámetros, respuestas y errores.
- [Arquitectura](docs/arquitectura.md): flujo, persistencia, configuración y decisiones técnicas.
- Guías: [testing](docs/guides/testing.md), [probar errores](docs/guides/probar-errores.md), [subir archivos](docs/guides/subir-archivos.md) y [desplegar con Docker](docs/guides/desplegar-con-docker.md).
