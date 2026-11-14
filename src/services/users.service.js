import { usersRepository } from '../repositories/users.repository.js'
import { storesRepository } from '../repositories/stores.repository.js'

const userCreateInput = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const { name, email, role } = data
  return { name, email, ...(Object.hasOwn(data, 'role') ? { role } : {}) }
}

export const usersService = {
  createUser: (data) => usersRepository.create(
    Array.isArray(data) ? data.map(userCreateInput) : userCreateInput(data),
  ),
  getUsers: () => usersRepository.findAll(),
  createStore: (data) => storesRepository.create(data),
}
