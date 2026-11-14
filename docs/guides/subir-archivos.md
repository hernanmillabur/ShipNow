# Subir documentos y comprobantes

Esta guía muestra cómo enviar archivos a ShipNow. Para los contratos completos y las respuestas posibles, consulta la [referencia de API](../api-reference.md).

**Advertencia:** el proyecto no tiene autenticación ni autorización. Las rutas aceptan cargas para cualquier ID existente y no comprueban que el solicitante sea dueño del User o el conductor asignado a Delivery. No envíes documentos o comprobantes reales hasta que se integre autorización efectiva.

## Requisitos del archivo

Se aceptan PDF, JPEG y PNG. El límite es 5 MiB por documento de usuario y 10 MiB por comprobante de entrega. El servidor verifica el MIME, la extensión y la firma inicial (`%PDF-`, `FF D8 FF` o la firma PNG). Es una comprobación básica de formato, no un análisis antimalware.

Los nombres físicos se generan en el servidor. El nombre original se conserva saneado como metadato. Los bytes se guardan bajo `UPLOADS_DIR` o, si no está configurada, en `uploads/` en la raíz del proyecto. MongoDB guarda metadatos y rutas relativas, no el contenido binario.

## Documento de usuario

El endpoint `POST /api/users/{userId}/documents` requiere el archivo en `file` y el campo `documentType`, que puede ser `identity`, `driver_license` o `proof_of_address`.

```bash
curl -i -X POST http://localhost:8080/api/users/ID_DEL_USUARIO/documents \
  -F 'file=@./identity.pdf;type=application/pdf' \
  -F 'documentType=identity'
```

La respuesta `201` contiene los campos generales del usuario y los metadatos del nuevo documento, incluido el ID del subdocumento persistido. No devuelve el historial documental. User puede tener varios documentos.

## Comprobante de entrega

El endpoint `POST /api/deliveries/{deliveryId}/proof` requiere el archivo en `file`:

```bash
curl -i -X POST http://localhost:8080/api/deliveries/ID_DE_LA_ENTREGA/proof \
  -F 'file=@./proof.jpg;type=image/jpeg'
```

La respuesta `201` contiene los campos generales de Delivery y los metadatos del comprobante recién agregado, incluido el ID del subdocumento persistido. No devuelve el historial de comprobantes. Una entrega puede tener varios comprobantes.

Los errores se devuelven en el formato centralizado de ShipNow. Consulta los códigos de carga en la [guía de errores](probar-errores.md).
