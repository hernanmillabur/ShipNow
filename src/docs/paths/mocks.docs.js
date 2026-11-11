/**
 * @openapi
 * /api/mocks/users:
 *   get:
 *     tags: [Mocks]
 *     summary: Generar usuarios ficticios en memoria
 *     description: Devuelve clientes y repartidores de prueba sin persistirlos.
 *     parameters:
 *       - name: qty
 *         in: query
 *         required: false
 *         description: Cantidad de clientes y repartidores. Predeterminado 2; entero entre 1 y 100.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 2
 *     responses:
 *       '200':
 *         description: Usuarios ficticios generados.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         customers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         drivers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *       '400':
 *         description: INVALID_MOCK_QUANTITY.
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
 * /api/mocks/orders:
 *   get:
 *     tags: [Mocks]
 *     summary: Generar pedidos ficticios en memoria
 *     description: Devuelve pedidos junto con clientes y tiendas relacionados, sin persistirlos.
 *     parameters:
 *       - name: qty
 *         in: query
 *         required: false
 *         description: Cantidad de pedidos. Predeterminado 5; entero entre 1 y 100.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 5
 *     responses:
 *       '200':
 *         description: Pedidos ficticios generados.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         customers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         stores:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Store'
 *                         orders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Order'
 *       '400':
 *         description: INVALID_MOCK_QUANTITY.
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
 * /api/mocks/deliveries:
 *   get:
 *     tags: [Mocks]
 *     summary: Generar entregas ficticias en memoria
 *     description: Devuelve usuarios, tiendas, pedidos y entregas relacionadas sin persistirlos.
 *     parameters:
 *       - name: qty
 *         in: query
 *         required: false
 *         description: Cantidad de conjuntos de pedidos y entregas. Predeterminado 5; entero entre 1 y 100.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 5
 *     responses:
 *       '200':
 *         description: Conjunto ficticio generado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         customers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         drivers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         stores:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Store'
 *                         orders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Order'
 *                         deliveries:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Delivery'
 *       '400':
 *         description: INVALID_MOCK_QUANTITY.
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
 * /api/mocks/seed:
 *   post:
 *     tags: [Mocks]
 *     summary: Insertar un conjunto relacionado de datos de prueba
 *     description: Persiste clientes, repartidores, tiendas, pedidos y entregas en MongoDB. Se recomienda enviar qty en el body; query se conserva por compatibilidad y se usa si body no lo informa. Si ambos lo informan, prevalece el body.
 *     parameters:
 *       - name: qty
 *         in: query
 *         required: false
 *         description: Alternativa compatible al body. Predeterminado 10; entero entre 1 y 100.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qty:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *           example:
 *             qty: 10
 *     responses:
 *       '201':
 *         description: Registros de prueba persistidos y relacionados.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         customers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         drivers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         stores:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Store'
 *                         orders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Order'
 *                         deliveries:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Delivery'
 *       '400':
 *         description: INVALID_MOCK_QUANTITY.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: MOCK_SEED_FAILED; la causa original se conserva internamente y no se expone al cliente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
