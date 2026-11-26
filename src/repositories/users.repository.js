import UserModel from '../models/user.model.js'

export const usersRepository = {
  create: (data) => UserModel.create(data),
  findById: (id) => UserModel.findById(id).lean(),
  findPage: async ({ filter, skip, limit }) => {
    const [items, totalItems] = await Promise.all([
      UserModel.find(filter).select('-documents').sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(filter),
    ])
    return { items, totalItems }
  },
  addDocument: (id, metadata) => UserModel.findByIdAndUpdate(
    id,
    { $push: { documents: metadata } },
    { new: true, runValidators: true },
  ).lean(),
}
