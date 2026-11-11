const objectId = { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: '665f1e5b20dd2f9bd1e2a123' }
const recordId = { type: 'string', example: '665f1e5b20dd2f9bd1e2a123' }

export const schemas = {
  User: {
    type: 'object',
    properties: {
      _id: recordId,
      name: { type: 'string', example: 'Ana Pérez' },
      email: { type: 'string', example: 'ana@example.test' },
      role: { type: 'string', enum: ['admin', 'user', 'customer', 'driver', 'store'], example: 'customer' },
      __v: { type: 'integer' },
    },
    required: ['_id', 'name', 'email', 'role'],
  },
  UserCreateInput: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', enum: ['admin', 'user', 'customer', 'driver', 'store'], default: 'customer' },
    },
    required: ['name', 'email'],
  },
  Store: {
    type: 'object',
    properties: {
      _id: recordId,
      name: { type: 'string' },
      address: { type: 'string' },
      __v: { type: 'integer' },
    },
    required: ['_id', 'name'],
  },
  StoreCreateInput: {
    type: 'object',
    properties: { name: { type: 'string' }, address: { type: 'string' } },
    required: ['name'],
  },
  OrderItem: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      price: { type: 'number' },
      quantity: { type: 'number' },
    },
  },
  Order: {
    type: 'object',
    properties: {
      _id: recordId,
      userId: recordId,
      storeId: recordId,
      address: { type: 'string' },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      total: { type: 'number' },
      status: { type: 'string', enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'] },
      priority: { type: 'string', enum: ['low', 'normal', 'high'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      __v: { type: 'integer' },
    },
    required: ['_id', 'userId', 'storeId', 'address', 'items', 'total', 'status', 'priority'],
  },
  OrderCreateInput: {
    type: 'object',
    properties: {
      userId: objectId,
      storeId: objectId,
      address: { type: 'string' },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
    },
    required: ['userId', 'storeId', 'address', 'items'],
  },
  Delivery: {
    type: 'object',
    properties: {
      _id: recordId,
      orderId: recordId,
      driverId: recordId,
      status: { type: 'string', enum: ['pending', 'in_transit', 'delivered'] },
      assignedAt: { type: 'string', format: 'date-time' },
      deliveredAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      __v: { type: 'integer' },
    },
    required: ['_id', 'orderId', 'driverId', 'status', 'assignedAt', 'deliveredAt'],
  },
  DeliveryCreateInput: {
    type: 'object',
    properties: {
      orderId: objectId,
      driverId: objectId,
      status: { type: 'string', enum: ['pending', 'in_transit', 'delivered'], default: 'pending' },
      assignedAt: { type: 'string', format: 'date-time' },
      deliveredAt: { type: 'string', format: 'date-time', nullable: true },
    },
    required: ['orderId', 'driverId'],
  },
  Product: {
    type: 'object',
    properties: {
      _id: recordId,
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 },
      stock: { type: 'integer', minimum: 0 },
      status: { type: 'string', enum: ['available', 'out_of_stock'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      __v: { type: 'integer' },
    },
    required: ['_id', 'name', 'description', 'price', 'stock', 'status', 'createdAt', 'updatedAt'],
  },
  ProductCreateInput: {
    type: 'object',
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1, pattern: '\\S', description: 'Debe contener al menos un carácter que no sea espacio.' },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 },
      stock: { type: 'integer', minimum: 0 },
    },
    required: ['name', 'price', 'stock'],
  },
  ProductUpdateInput: {
    type: 'object',
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1, pattern: '\\S', description: 'Debe contener al menos un carácter que no sea espacio.' },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 },
      stock: { type: 'integer', minimum: 0 },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['error'] },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'INVALID_REQUEST' },
          message: { type: 'string', example: 'La solicitud no es válida.' },
        },
        required: ['code', 'message'],
      },
    },
    required: ['status', 'error'],
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['success'] },
      payload: {},
    },
    required: ['status', 'payload'],
  },
}
