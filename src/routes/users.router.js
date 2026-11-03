import { Router } from 'express'
import { createUser, getUsers, createStore } from '../controllers/users.controller.js'

const router = Router()

router.post('/', createUser)
router.get('/', getUsers)
router.post('/stores', createStore)

export default router
