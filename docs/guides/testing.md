# Guía de testing

Esta guía explica cómo ejecutar la suite funcional de ShipNow y cómo comprobar que sus pruebas utilizan exclusivamente MongoDB temporal.

## Herramientas

El proyecto usa Mocha 12 para ejecutar las pruebas, Chai 6 para las aserciones, Supertest 7 para las peticiones HTTP y `mongodb-memory-server` 11 para levantar MongoDB temporal. Las versiones exactas están declaradas en `package.json` y bloqueadas en `package-lock.json`.

## Instalar dependencias

Desde la raíz del proyecto:

```bash
npm install
```

No hace falta tener una instancia MongoDB propia ni configurar Atlas para correr la suite.

## Ejecutar las pruebas

Ejecuta todos los tests con:

```bash
npm test
```

Para ejecutar un archivo específico, usa Mocha con el mismo setup global. Por ejemplo, en Bash:

```bash
npx mocha --require ./tests/setup.js --timeout 120000 --no-parallel tests/orders.test.js
```

En PowerShell, usa el shim de Windows:

```powershell
npx.cmd mocha --require ./tests/setup.js --timeout 120000 --no-parallel tests/orders.test.js
```

Reemplaza `tests/orders.test.js` por `tests/users.test.js`, `tests/products.test.js`, `tests/deliveries.test.js`, `tests/mocks.test.js`, `tests/uploads.test.js`, `tests/logging.test.js`, `tests/not-found.test.js` o `tests/swagger.test.js` según el módulo que quieras ejecutar. No agregues `--exit`: Mocha debe cerrar cuando los hooks terminen correctamente.

No ejecutes `npm run dev` ni `npm start` para correr los tests. Esos comandos importan `src/server.js`, inician un servidor HTTP y abren una conexión para la aplicación normal.

## MongoDB temporal y aislamiento

`tests/setup.js` establece automáticamente `NODE_ENV=test` y `PORT=8080`. Después inicia MongoMemoryServer y asigna a `MONGODB_URI` la URI temporal que devuelve ese servidor. El binario de MongoDB usado es **8.0.34**.

Si el binario no está en caché, MongoMemoryServer puede descargarlo en la primera ejecución. Lo guarda bajo la carpeta temporal del sistema (`shipnow-mongodb-binaries`); una descarga puede requerir acceso a los servidores de distribución de MongoDB, pero no es una conexión a Atlas.

El helper `tests/helpers/database.js` valida que la URI use el protocolo `mongodb:`, un host local, no incluya usuario ni contraseña y apunte a `shipnow_test`. Antes de cada prueba vacía las colecciones. Al terminar, desconecta Mongoose y detiene MongoMemoryServer.

El setup importa `src/app.js`, que exporta Express sin iniciar HTTP ni conectarse a MongoDB. La suite no importa `src/server.js`. Así, ninguna URI de una base de desarrollo o Atlas se usa para las pruebas.

`tests/setup.js` también crea un directorio temporal aislado y lo asigna a `UPLOADS_DIR` antes de importar la app. La carpeta se limpia antes de cada prueba y se elimina al finalizar; `uploads/` no se usa en testing. `tests/uploads.test.js` genera buffers sintéticos PDF, JPEG y PNG y verifica tanto los archivos físicos como los metadatos persistidos y su limpieza ante fallos.

Las pruebas también comprueban que la creación normal de User y Delivery no acepte metadatos documentales enviados directamente y que las respuestas de listados/carga no incluyan el historial de documentos o comprobantes. No hay pruebas de autorización por usuario o repartidor porque la aplicación aún no dispone de autenticación ni permisos; no se simula una identidad.

Puedes revisar esos puntos en el código sin imprimir valores de entorno:

```bash
rg -n 'MongoMemoryServer|assertIsTemporaryLocalUri|mongoose\.connect|MONGODB_URI' tests/setup.js tests/helpers/database.js src
```

## Cuando una prueba falla

1. Lee el primer error de Mocha y la aserción que lo originó.
2. Ejecuta el archivo afectado con uno de los comandos anteriores para aislar el caso.
3. Comprueba si el fallo corresponde al contrato actual de la ruta o a una expectativa desactualizada.
4. Si el error ocurre al iniciar MongoMemoryServer y falta el binario, permite que se complete la descarga y vuelve a ejecutar `npm test`.
5. No soluciones fallos iniciando el servidor normal ni cambiando la URI de test a una base compartida.

Los logs de Winston pueden escribirse bajo `logs/test/`; la suite no necesita leer archivos de log anteriores para pasar.
