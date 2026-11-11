/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Listar productos
 *     responses:
 *       '200':
 *         description: Lista de productos.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       '500':
 *         description: INTERNAL_ERROR.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Products]
 *     summary: Crear un producto
 *     description: El status se deriva del stock y no se envía en el body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateInput'
 *     responses:
 *       '201':
 *         description: Producto creado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Product'
 *       '400':
 *         description: INVALID_PRODUCT_FIELD, INVALID_PRODUCT_NAME, INVALID_PRODUCT_PRICE, INVALID_PRODUCT_STOCK, INVALID_PRODUCT_DESCRIPTION, VALIDATION_ERROR o INVALID_REQUEST.
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
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Obtener un producto
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       '200':
 *         description: Producto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Product'
 *       '400':
 *         description: INVALID_ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: PRODUCT_NOT_FOUND.
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
 *   put:
 *     tags: [Products]
 *     summary: Actualizar datos de un producto
 *     description: Acepta un subconjunto de name, description, price y stock. El status se recalcula según el stock resultante.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateInput'
 *     responses:
 *       '200':
 *         description: Producto actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/Product'
 *       '400':
 *         description: INVALID_ID, INVALID_PRODUCT_FIELD, INVALID_PRODUCT_NAME, INVALID_PRODUCT_PRICE, INVALID_PRODUCT_STOCK, INVALID_PRODUCT_DESCRIPTION, VALIDATION_ERROR o INVALID_REQUEST.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: PRODUCT_NOT_FOUND.
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
 *   delete:
 *     tags: [Products]
 *     summary: Eliminar un producto
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *     responses:
 *       '204':
 *         description: Producto eliminado; no devuelve body.
 *       '400':
 *         description: INVALID_ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: PRODUCT_NOT_FOUND.
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
