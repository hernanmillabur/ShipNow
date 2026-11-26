import OrderModel from '../models/order.model.js'

export const ordersRepository = {
  create: (data) => OrderModel.create(data),
  findById: (id) => OrderModel.findById(id).lean(),
  findPage: async ({ filter, skip, limit }) => {
    const [items, totalItems] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ])
    return { items, totalItems }
  },
  updateStatus: (id, status) =>
    OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean(),
}
