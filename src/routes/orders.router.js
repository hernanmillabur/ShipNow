import { Router } from 'express'
import { createOrder, getOrders, getOrderById, deliverOrder } from '../controllers/orders.controller.js'

const router = Router()

router.post('/', createOrder)
router.get('/', getOrders)
router.get('/:id', getOrderById)
router.patch('/:id/deliver', deliverOrder)

export default router
