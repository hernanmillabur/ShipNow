import ProductModel from '../models/product.model.js'

export const productsRepository = {
  getAll: () => ProductModel.find({}, { __v: 0 }).sort({ createdAt: -1 }).lean(),
  getById: (id) => ProductModel.findById(id, { __v: 0 }).lean(),
  create: (data) => ProductModel.create(data),
  update: (id, data) => ProductModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    projection: { __v: 0 },
  }).lean(),
  delete: (id) => ProductModel.findByIdAndDelete(id, { projection: { __v: 0 } }).lean(),
}
