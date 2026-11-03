import { usersRepository } from '../repositories/users.repository.js'
import { storesRepository } from '../repositories/stores.repository.js'

export const usersService = {
  createUser: (data) => usersRepository.create(data),
  getUsers: () => usersRepository.findAll(),
  createStore: (data) => storesRepository.create(data),
}
