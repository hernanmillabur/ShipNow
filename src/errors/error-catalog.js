const definitions = {
  USER_NOT_FOUND: [404, 'Usuario no encontrado.'],
  STORE_NOT_FOUND: [404, 'Tienda no encontrada.'],
  ORDER_NOT_FOUND: [404, 'Pedido no encontrado.'],
  PRODUCT_NOT_FOUND: [404, 'Producto no encontrado.'],
  DRIVER_NOT_FOUND: [404, 'Repartidor no encontrado.'],
  INVALID_DRIVER_ROLE: [400, 'El usuario asignado no tiene el rol de repartidor.'],
  INVALID_STATE: [400, 'El estado actual no permite esta operación.'],
  INVALID_MOCK_QUANTITY: [400, 'La cantidad debe ser un entero entre 1 y 100.'],
  INVALID_PRODUCT_FIELD: [400, 'Los datos del producto contienen un campo no permitido.'],
  INVALID_PRODUCT_NAME: [400, 'El nombre del producto no es válido.'],
  INVALID_PRODUCT_PRICE: [400, 'El precio del producto debe ser un número no negativo.'],
  INVALID_PRODUCT_STOCK: [400, 'El stock debe ser un entero no negativo.'],
  INVALID_PRODUCT_DESCRIPTION: [400, 'La descripción del producto no es válida.'],
  INVALID_PRODUCT_DATA: [400, 'Los datos del producto no son válidos.'],
  INVALID_ID: [400, 'El identificador no es válido.'],
  VALIDATION_ERROR: [400, 'Los datos enviados no son válidos.'],
  INVALID_REQUEST: [400, 'La solicitud no es válida.'],
  DUPLICATE_RESOURCE: [409, 'Ya existe un registro con esos datos.'],
  MOCK_SEED_FAILED: [500, 'No se pudieron guardar los datos de prueba.'],
  INTERNAL_ERROR: [500, 'Ocurrió un error interno.'],
}

export const ERROR_CATALOG = Object.freeze(Object.fromEntries(
  Object.entries(definitions).map(([code, [status, message]]) => [
    code,
    Object.freeze({ code, status, message }),
  ]),
))
