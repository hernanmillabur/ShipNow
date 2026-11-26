/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Crear un usuario
 *     description: El rol permitido se define por las constantes del proyecto; si se omite, el modelo asigna customer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateInput'
 *     responses:
 *       '201':
 *         description: Usuario creado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/User'
 *       '400':
 *         description: VALIDATION_ERROR o INVALID_REQUEST.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: DUPLICATE_RESOURCE por email duplicado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: INTERNAL_ERROR.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags: [Users]
 *     summary: Listar usuarios
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, user, customer, driver, store] }
 *     description: Endpoint sin autenticación. La respuesta omite metadatos documentales; los campos generales del usuario continúan visibles.
 *     responses:
 *       '200':
 *         description: Página de usuarios sin metadatos documents.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/UserPage'
 *       '400':
 *         description: INVALID_REQUEST para parámetros de consulta no válidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: INTERNAL_ERROR.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /api/users/stores:
 *   post:
 *     tags: [Users]
 *     summary: Crear una tienda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreCreateInput'
 *     responses:
 *       '201':
 *         description: Tienda creada.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Store'
 *       '400':
 *         description: VALIDATION_ERROR o INVALID_REQUEST.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: INTERNAL_ERROR.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
