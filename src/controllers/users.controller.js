import { usersService } from '../services/users.service.js'

export const createUser = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body)
    res.status(201).json({ status: 'success', payload: user })
  } catch (error) {
    next(error)
  }
}

export const getUsers = async (req, res, next) => {
  try {
    res.json({ status: 'success', payload: await usersService.getUsers() })
  } catch (error) {
    next(error)
  }
}

export const createStore = async (req, res, next) => {
  try {
    const store = await usersService.createStore(req.body)
    res.status(201).json({ status: 'success', payload: store })
  } catch (error) {
    next(error)
  }
}
