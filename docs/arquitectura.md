# Arquitectura de ShipNow

ShipNow separa la configuración de Express, el arranque HTTP, las reglas de negocio, la persistencia y las respuestas HTTP. Esta página explica las decisiones visibles en el código y sus efectos.

## Flujo Controller → Service → Repository

Las rutas de `src/routes/` conectan un método y una URL con un controlador. Los controladores de `src/controllers/` reciben `req`, llaman a un servicio, construyen el envelope HTTP y envían los errores al middleware con `next(error)`.

Los servicios de `src/services/` coordinan reglas de negocio y repositorios. Por ejemplo, `ordersService.createOrder` valida el body, comprueba usuario y tienda, calcula el total y crea el pedido. `deliveriesService.create` comprueba que el pedido exista y que el usuario tenga rol `driver` antes de crear la entrega.

Los repositorios de `src/repositories/` encapsulan las consultas Mongoose. Esta separación mantiene el acceso a modelos fuera de controladores y concentra las reglas de aplicación en servicios.

## Modelos Mongoose

Los modelos de `src/models/` representan `User`, `Store`, `Product`, `Order` y `Delivery`.

- User valida nombre, email único y rol enumerado; el rol predeterminado es `customer`. `documents` mantiene una lista embebida de metadatos de archivos.
- Store requiere nombre.
- Product almacena nombre, descripción, precio, stock y estado. El servicio valida los datos y deriva el estado del stock.
- Order relaciona usuario y tienda, contiene ítems, total, estado y prioridad. El servicio calcula el total y asigna `pending` al crear.
- Delivery relaciona pedido y repartidor, mantiene estado enumerado, fechas de asignación y entrega y una lista embebida `proofs`. Si no se envía estado, el modelo usa `pending`.

## Carga de archivos

`src/config/multer.config.js` centraliza el almacenamiento multipart y los límites. `UPLOADS_DIR` opcional selecciona el directorio raíz; si se omite, se usa `uploads/` en la raíz del repositorio. Los archivos se organizan bajo `users/<userId>/` y `deliveries/<deliveryId>/`; el nombre físico es un UUID con extensión derivada del MIME aceptado. `uploads/` está excluido de Git y no se monta con `express.static`.

Se admiten PDF, JPEG y PNG, con límites de 5 MiB para documentos de usuarios y 10 MiB para comprobantes. Multer filtra el MIME declarado y el Service contrasta extensión, MIME y firma inicial del contenido. Esta comprobación de firmas no es un análisis antimalware. El nombre original se sanea y se guarda solo como metadato; MongoDB conserva rutas relativas, MIME, tamaño, categoría documental y fecha, no el binario.

Los documentos se guardan en `User.documents` y los comprobantes en `Delivery.proofs`; ambas listas pueden contener varios metadatos reutilizando el mismo esquema. Si falla una validación posterior a Multer, no existe la entidad o falla la persistencia, el Service intenta eliminar el nuevo archivo. Un fallo en esta compensación se registra en Winston sin incluir el path.

Los servicios de creación de User y Delivery proyectan los campos admitidos por sus contratos y descartan `documents`/`proofs` enviados por el cliente; esos metadatos solo se añaden desde el flujo de carga. Los listados de Users y las respuestas de carga no devuelven historiales documentales.

## Autenticación y autorización

El proyecto conserva roles como datos de User, pero no tiene autenticación, principal de solicitud ni autorización por recurso. `JWT_SECRET` es opcional y no se consume. Por eso las cargas todavía no comprueban propiedad de User o asignación de Delivery, y la API no debe recibir documentos reales hasta incorporar controles de identidad y permisos.

## Aplicación y servidor

`src/app.js` crea Express, registra middlewares y monta las rutas; exporta la aplicación sin abrir un puerto ni conectar MongoDB. Esta separación permite entregar la misma aplicación a Supertest sin iniciar el servidor normal.

`src/server.js` es el punto de entrada de `npm start` y `npm run dev`. Lee `PORT`, `MONGODB_URI` y `NODE_ENV`, inicia HTTP y luego conecta Mongoose. Antes configura el resolver DNS del proceso como `1.1.1.1`. Si MongoDB no conecta, registra el error y programa otro intento a los cinco segundos; el código no limita el número de reintentos.

## Configuración de entorno

`src/config/env.config.js` carga dotenv y expone getters validados. `PORT`, `MONGODB_URI` y `NODE_ENV` son requeridas cuando se consultan; el puerto debe estar entre 1 y 65535 y los entornos admitidos son `development`, `production` y `test`. `JWT_SECRET` es opcional y no se consume actualmente.

La URI depende del proceso: el servidor normal usa la que se configure para la ejecución, mientras que el setup de tests asigna la URI generada por MongoMemoryServer. No hay fallback automático desde la suite a una base externa.

## Manejo centralizado de errores

Los controladores envían excepciones al middleware `src/middlewares/error.middleware.js`. `DomainError` usa el catálogo de `src/errors/error-catalog.js` para definir código, mensaje y status HTTP estables. El middleware también convierte errores Mongoose conocidos —como `CastError`, `ValidationError` y duplicados— en errores del catálogo.

Las rutas gestionadas siguen el formato `{ status: "error", error: { code, message } }`. Después de registrar todos los routers, `src/middlewares/not-found.middleware.js` convierte cualquier path sin ruta coincidente en `RouteNotFoundError`; el middleware global lo responde como HTTP 404 con el código `ROUTE_NOT_FOUND`.

## Logging y monitoreo

`src/logging/logger.js` configura Winston con niveles personalizados y transportes de consola y archivos rotativos. Los niveles y su orden de severidad son `fatal`, `error`, `warning`, `http`, `info` y `debug`.

El threshold es `debug` en development y test, e `info` en production. Los transportes de archivo guardan registros combinados y errores en subdirectorios de `logs/`; rotan diariamente, con límite de 20 MB y retención de 14 días. El formato filtra claves y cadenas que parecen contener secretos, tokens o URI MongoDB.

El middleware de solicitudes registra método, ruta, status y duración. `GET /api/logging/test` emite los seis niveles en development y test; el nivel fatal lleva marca `simulated` y no termina el proceso. En production la ruta devuelve `LOGGER_TEST_DISABLED`.

## Swagger y OpenAPI

`src/config/swagger.config.js` genera OpenAPI 3.0.3 con `swagger-jsdoc` leyendo `src/docs/paths/*.docs.js` y los schemas reutilizables de `src/docs/schemas/index.js`. `swagger-ui-express` sirve la interfaz en `/api/docs/`. Los documentos de referencia de esta API apuntan a la misma especificación y a las rutas registradas. La especificación actual no declara autenticación.

## Estrategia de testing

El setup global de Mocha en `tests/setup.js` asigna `NODE_ENV=test` y `PORT=8080`, levanta MongoMemoryServer y entrega su URI a Mongoose. `tests/helpers/database.js` exige una URI local para `shipnow_test`, limpia las colecciones antes de cada prueba y cierra tanto Mongoose como el servidor temporal al terminar.

La versión del binario temporal es MongoDB 8.0.34. Las pruebas importan `app.js` y usan Supertest; no importan `server.js`, no inician el servidor normal y no necesitan Atlas. El setup también intercepta temporalmente `listen` al importar la aplicación para detectar un arranque HTTP accidental.

El setup crea una carpeta temporal para `UPLOADS_DIR` antes de importar `app.js`, la vacía antes de cada prueba y la elimina al terminar. Los casos de carga usan buffers sintéticos; no escriben en `uploads/`.

El comando de ejecución es `npm test`. La explicación detallada de comandos y diagnóstico está en la [guía de testing](guides/testing.md).
