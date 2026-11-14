import { Router } from 'express'
import { createDelivery, uploadDeliveryProof as uploadDeliveryProofController } from '../controllers/deliveries.controller.js'
import { uploadDeliveryProof } from '../middlewares/upload.middleware.js'

const router = Router()

router.post('/', createDelivery)
router.post('/:deliveryId/proof', uploadDeliveryProof, uploadDeliveryProofController)

export default router
