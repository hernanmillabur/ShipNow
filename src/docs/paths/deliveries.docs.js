/**
 * @openapi
 * /api/deliveries:
 *   post:
 *     tags: [Deliveries]
 *     summary: Crear una entrega y asignar un repartidor
 *     description: orderId debe corresponder a un pedido existente y driverId a un usuario existente con rol driver. Requiere MongoDB y registros relacionados.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryCreateInput'
 *     responses:
 *       '201':
 *         description: Entrega creada.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Delivery'
 *       '400':
 *         description: INVALID_ID, INVALID_DRIVER_ROLE, VALIDATION_ERROR o INVALID_REQUEST.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: ORDER_NOT_FOUND o DRIVER_NOT_FOUND.
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
