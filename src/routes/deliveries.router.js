import { Router } from 'express'
import { createDelivery } from '../controllers/deliveries.controller.js'

const router = Router()

router.post('/', createDelivery)

export default router
