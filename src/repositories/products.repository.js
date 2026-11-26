import ProductModel from '../models/product.model.js'

export const productsRepository = {
  getPage: async ({ filter, skip, limit }) => {
    const [items, totalItems] = await Promise.all([
      ProductModel.find(filter, { __v: 0 }).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(filter),
    ])
    return { items, totalItems }
  },
  getById: (id) => ProductModel.findById(id, { __v: 0 }).lean(),
  create: (data) => ProductModel.create(data),
  update: (id, data) => ProductModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    projection: { __v: 0 },
  }).lean(),
  delete: (id) => ProductModel.findByIdAndDelete(id, { projection: { __v: 0 } }).lean(),
}
