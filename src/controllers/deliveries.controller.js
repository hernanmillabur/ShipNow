import { deliveriesService } from '../services/deliveries.service.js'

export const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveriesService.create(req.body)
    res.status(201).json({ status: 'success', payload: delivery })
  } catch (error) {
    next(error)
  }
}
