# Desplegar ShipNow con Docker

## 1. Configura MongoDB y construye

La base de datos debe ejecutarse fuera del filesystem de la API. Usa una instancia administrada o un MongoDB independiente y proporciona `MONGODB_URI` al contenedor. No se incluye ni se inicia MongoDB en la imagen.

Desde la raíz del repositorio:

```bash
docker build -t shipnow:modulo-8 .
```

En PowerShell:

```powershell
docker build -t shipnow:modulo-8 .
```

## 2. Prepara uploads persistentes

El proceso usa `/app/data/uploads`, propiedad del usuario no root `node`. Crea un volumen con nombre para conservar los archivos al recrear el contenedor.

```bash
docker volume create shipnow_uploads
docker run -d --name shipnow -p 8080:8080 \
  -e MONGODB_URI='mongodb://host.docker.internal:27017/shipnow' \
  -e NODE_ENV=production \
  -v shipnow_uploads:/app/data/uploads \
  shipnow:modulo-8
```

PowerShell:

```powershell
docker volume create shipnow_uploads
docker run -d --name shipnow -p 8080:8080 `
  -e MONGODB_URI='mongodb://host.docker.internal:27017/shipnow' `
  -e NODE_ENV=production `
  -v shipnow_uploads:/app/data/uploads `
  shipnow:modulo-8
```

Reemplaza la URI de ejemplo por el URI del MongoDB del entorno. No guardes credenciales en el Dockerfile ni en la imagen. En redes Docker, usa el nombre de host o servicio accesible desde el contenedor. MongoDB almacena metadatos y rutas relativas; los binarios quedan en el volumen.

## 3. Verifica la aplicación

El puerto predeterminado del contenedor es `8080`. Docker consulta `/api/health` con Node.js `fetch`. Revisa el estado y los logs:

```bash
docker ps
docker inspect --format='{{.State.Health.Status}}' shipnow
docker logs shipnow
```

PowerShell:

```powershell
docker ps
docker inspect --format='{{.State.Health.Status}}' shipnow
docker logs shipnow
```

`GET /api/health` devuelve estado, entorno, uptime y timestamp, sin información de conexión. Swagger está disponible en development/test, y en production solo si configuras `SWAGGER_ENABLED=true`. Los endpoints de mocks y `/api/logging/test` responden 404 en producción.

## 4. Variables

Requeridas: `PORT`, `MONGODB_URI`, `NODE_ENV` (`development`, `test` o `production`). En el contenedor `PORT` predeterminado es `8080` y `NODE_ENV` es `production`.

Opcionales: `LOG_LEVEL` (`fatal`, `error`, `warning`, `http`, `info`, `debug`), `UPLOADS_DIR` (predeterminado `/app/data/uploads`), `SWAGGER_ENABLED` y `LOG_TO_FILE` (booleanos `true`/`false`). JWT no está implementado y no se requiere `JWT_SECRET`.

Winston escribe a stdout/stderr para que `docker logs` sea la fuente predeterminada. Si activas `LOG_TO_FILE=true`, los archivos rotativos se escriben en `/app/logs/production`; persiste también ese directorio:

```bash
docker run ... -v shipnow_logs:/app/logs ...
```

No se copia `.env` al build. `.dockerignore` excluye dependencias locales, secretos, logs, uploads, pruebas, documentación y archivos temporales.
