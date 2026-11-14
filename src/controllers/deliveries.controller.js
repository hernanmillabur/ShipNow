import { deliveriesService } from '../services/deliveries.service.js'
import { uploadsService } from '../services/uploads.service.js'

export const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveriesService.create(req.body)
    res.status(201).json({ status: 'success', payload: delivery })
  } catch (error) {
    next(error)
  }
}

export const uploadDeliveryProof = async (req, res, next) => {
  try {
    const result = await uploadsService.attachDeliveryProof(req.params.deliveryId, req.file)
    const { proofs: _proofs, ...delivery } = result.entity
    res.status(201).json({ status: 'success', payload: { delivery, proof: result.document } })
  } catch (error) {
    next(error)
  }
}
