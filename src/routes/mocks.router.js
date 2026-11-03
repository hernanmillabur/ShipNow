import { Router } from 'express'
import {
  getMockDeliveries,
  getMockOrders,
  getMockUsers,
  seedMocks,
} from '../controllers/mocks.controller.js'

const router = Router()

router.get('/users', getMockUsers)
router.get('/orders', getMockOrders)
router.get('/deliveries', getMockDeliveries)
router.post('/seed', seedMocks)

export default router
