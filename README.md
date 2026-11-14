# ShipNow v2

ShipNow es una API REST para gestionar usuarios, tiendas, productos, pedidos y entregas. Está construida con Node.js, Express y MongoDB mediante Mongoose; usa Winston para logging y Swagger UI para explorar la API.

## Requisitos

- Node.js 24.14.1 y npm. Esa es la versión usada para esta entrega; el proyecto utiliza ES Modules.
- Una instancia accesible de MongoDB para ejecutar la API y las operaciones persistentes. **No se necesita Atlas para ejecutar los tests.**

## Puesta en marcha

Instala las dependencias y copia el archivo de ejemplo:

```bash
npm install
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

En Bash:

```bash
cp .env.example .env
```

Completa `MONGODB_URI` en `.env` con la URI del entorno MongoDB que utilizará la aplicación. Las variables son:

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP; entero entre 1 y 65535. El ejemplo usa `8080`. |
| `MONGODB_URI` | URI requerida para que el servidor conecte MongoDB. |
| `NODE_ENV` | Entorno requerido: `development`, `production` o `test`. |
| `JWT_SECRET` | Opcional y no utilizado actualmente por la API. |

Inicia en desarrollo con recarga al cambiar archivos:

```bash
npm run dev
```

Para iniciar el servidor sin modo watch, usa `npm start`. Para seleccionar producción, establece `NODE_ENV=production` en el entorno del proceso o en `.env` antes de iniciarlo. En PowerShell:

```powershell
$env:NODE_ENV = 'production'
npm start
```

## Testing

- **Herramientas:** Mocha, Chai y Supertest.
- **Comando:** `npm test`.
- **Cobertura:** Users, Stores, Products, Orders y sus estados, Deliveries, Mocks, Logger, Swagger y rutas inexistentes.
- **Base de datos:** MongoDB temporal con `mongodb-memory-server`.
- **Entorno de testing:** `tests/setup.js` configura `NODE_ENV=test`, `PORT=8080` y asigna a `MONGODB_URI` la URI de la instancia temporal.
- **Atlas:** no se requiere ni se utiliza una base Atlas para ejecutar los tests.

La suite puede ejecutarse repetidamente mediante `npm test`, utilizando una base de datos temporal e independiente. No es necesario iniciar `npm run dev` ni `npm start` para correrlas. Consulta la [guía de testing](docs/guides/testing.md) para comandos, aislamiento y diagnóstico de fallos.

## Documentación

- [Referencia de API](docs/api-reference.md): contratos, rutas, cuerpos y respuestas.
- [Arquitectura](docs/arquitectura.md): capas, errores, conexión, logging y testing.
- Guías prácticas: [testing](docs/guides/testing.md) y [probar errores](docs/guides/probar-errores.md).
- [Swagger UI](http://localhost:8080/api/docs/): disponible cuando el servidor está iniciado.
