import OrderModel from '../models/order.model.js'

export const ordersRepository = {
  create: (data) => OrderModel.create(data),
  findById: (id) => OrderModel.findById(id).lean(),
  findAll: (filter = {}) => OrderModel.find(filter).sort({ createdAt: -1 }).lean(),
  updateStatus: (id, status) =>
    OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean(),
}
