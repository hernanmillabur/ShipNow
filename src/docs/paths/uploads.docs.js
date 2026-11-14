/**
 * @openapi
 * /api/users/{userId}/documents:
 *   post:
 *     tags: [Users]
 *     summary: Cargar un documento de usuario
 *     description: Acepta PDF, JPEG o PNG hasta 5 MiB. La firma inicial del contenido también se valida; esto no es un análisis antimalware. El proyecto todavía no implementa autenticación ni autorización, por lo que este endpoint no verifica propiedad del usuario y no debe recibir documentos reales.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, documentType]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [identity, driver_license, proof_of_address]
 *           encoding:
 *             file:
 *               contentType: application/pdf, image/jpeg, image/png
 *     responses:
 *       '201':
 *         description: Documento almacenado y asociado al usuario.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       required: [user, document]
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         document:
 *                           $ref: '#/components/schemas/UserDocumentMetadata'
 *       '400':
 *         description: INVALID_ID, FILE_REQUIRED, INVALID_DOCUMENT_TYPE o UNEXPECTED_FILE_FIELD.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: USER_NOT_FOUND.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '413':
 *         description: FILE_TOO_LARGE.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '415':
 *         description: INVALID_FILE_TYPE.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: FILE_STORAGE_FAILED o FILE_METADATA_SAVE_FAILED.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /api/deliveries/{deliveryId}/proof:
 *   post:
 *     tags: [Deliveries]
 *     summary: Cargar un comprobante de entrega
 *     description: Acepta PDF, JPEG o PNG hasta 10 MiB. La firma inicial del contenido también se valida; esto no es un análisis antimalware. El proyecto todavía no implementa autenticación ni autorización, por lo que este endpoint no verifica la asignación del repartidor y no debe recibir comprobantes reales.
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             file:
 *               contentType: application/pdf, image/jpeg, image/png
 *     responses:
 *       '201':
 *         description: Comprobante almacenado y asociado a Delivery.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       required: [delivery, proof]
 *                       properties:
 *                         delivery:
 *                           $ref: '#/components/schemas/Delivery'
 *                         proof:
 *                           $ref: '#/components/schemas/DeliveryProofMetadata'
 *       '400':
 *         description: INVALID_ID, FILE_REQUIRED o UNEXPECTED_FILE_FIELD.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: DELIVERY_NOT_FOUND.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '413':
 *         description: FILE_TOO_LARGE.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '415':
 *         description: INVALID_FILE_TYPE.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: FILE_STORAGE_FAILED o FILE_METADATA_SAVE_FAILED.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
