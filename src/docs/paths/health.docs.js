/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Estado básico de la API
 *     responses:
 *       '200':
 *         description: Estado, entorno, tiempo activo y timestamp, sin configuración sensible.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Health'
 *       '503':
 *         description: MongoDB no está conectado; la aplicación no está disponible para operaciones persistentes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Health'
 */
