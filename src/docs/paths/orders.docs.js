/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Crear un pedido
 *     description: userId y storeId deben identificar registros existentes. El total se calcula desde items y el estado inicial es pending.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreateInput'
 *     responses:
 *       '201':
 *         description: Pedido creado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Order'
 *       '400':
 *         description: INVALID_ID, VALIDATION_ERROR o INVALID_REQUEST.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: USER_NOT_FOUND o STORE_NOT_FOUND.
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
 *     tags: [Orders]
 *     summary: Listar pedidos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, assigned, in_transit, delivered, cancelled] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, normal, high] }
 *       - in: query
 *         name: userId
 *         schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *       - in: query
 *         name: storeId
 *         schema: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *     responses:
 *       '200':
 *         description: Página de pedidos y metadatos de paginación.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/OrderPage'
 *       '400':
 *         description: INVALID_REQUEST por parámetros no válidos o INVALID_ID para filtros identificadores.
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
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Obtener un pedido
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       '200':
 *         description: Pedido encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Order'
 *       '400':
 *         description: INVALID_ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: ORDER_NOT_FOUND.
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
 * /api/orders/{id}/deliver:
 *   patch:
 *     tags: [Orders]
 *     summary: Marcar un pedido como entregado
 *     description: El servicio permite este cambio salvo que el pedido ya tenga estado delivered.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       '200':
 *         description: Pedido actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Order'
 *       '400':
 *         description: INVALID_ID o INVALID_STATE.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: ORDER_NOT_FOUND.
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
