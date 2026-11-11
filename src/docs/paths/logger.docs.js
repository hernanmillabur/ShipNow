/**
 * @openapi
 * /api/logging/test:
 *   get:
 *     tags: [Logger]
 *     summary: Emitir un registro de prueba por nivel
 *     description: Herramienta de validación del logger, no es una funcionalidad de negocio. El evento fatal es simulado y no termina el proceso. Disponible en development y test.
 *     responses:
 *       '200':
 *         description: Niveles emitidos en development o test.
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
 *                         levels:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: [debug, http, info, warning, error, fatal]
 *       '404':
 *         description: LOGGER_TEST_DISABLED en production.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
