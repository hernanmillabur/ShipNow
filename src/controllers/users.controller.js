import { usersService } from '../services/users.service.js'
import { uploadsService } from '../services/uploads.service.js'

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
    res.json({ status: 'success', payload: await usersService.getUsers(req.query) })
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

export const uploadUserDocument = async (req, res, next) => {
  try {
    const result = await uploadsService.attachUserDocument(
      req.params.userId,
      req.file,
      req.body.documentType,
    )
    const { documents: _documents, ...user } = result.entity
    res.status(201).json({ status: 'success', payload: { user, document: result.document } })
  } catch (error) {
    next(error)
  }
}
