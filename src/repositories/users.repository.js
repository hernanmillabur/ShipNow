import UserModel from '../models/user.model.js'

export const usersRepository = {
  create: (data) => UserModel.create(data),
  findById: (id) => UserModel.findById(id).lean(),
  findAll: () => UserModel.find().lean(),
}
