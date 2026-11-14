import DeliveryModel from '../models/delivery.model.js'

export const deliveriesRepository = {
  create: (data) => DeliveryModel.create(data),
  findById: (id) => DeliveryModel.findById(id).lean(),
  findAll: (filter = {}) => DeliveryModel.find(filter).sort({ createdAt: -1 }).lean(),
  addProof: (id, metadata) => DeliveryModel.findByIdAndUpdate(
    id,
    { $push: { proofs: metadata } },
    { new: true, runValidators: true },
  ).lean(),
}
