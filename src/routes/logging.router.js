import { Router } from 'express'
import { testLogging } from '../controllers/logging.controller.js'

const router = Router()

router.get('/test', testLogging)

export default router
