import { Router } from 'express'
import { createUser, getUsers, createStore, uploadUserDocument as uploadUserDocumentController } from '../controllers/users.controller.js'
import { uploadUserDocument } from '../middlewares/upload.middleware.js'

const router = Router()

router.post('/', createUser)
router.get('/', getUsers)
router.post('/stores', createStore)
router.post('/:userId/documents', uploadUserDocument, uploadUserDocumentController)

export default router
