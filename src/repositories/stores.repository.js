import StoreModel from '../models/store.model.js'

export const storesRepository = {
  create: (data) => StoreModel.create(data),
  findById: (id) => StoreModel.findById(id).lean(),
}
