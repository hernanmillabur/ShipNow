import { mocksService } from '../services/mocks.service.js'

export const getMockUsers = (req, res, next) => {
  try {
    res.json({ status: 'success', payload: mocksService.getUsers(req.query.qty) })
  } catch (error) { next(error) }
}

export const getMockOrders = (req, res, next) => {
  try {
    res.json({ status: 'success', payload: mocksService.getOrders(req.query.qty) })
  } catch (error) { next(error) }
}

export const getMockDeliveries = (req, res, next) => {
  try {
    res.json({ status: 'success', payload: mocksService.getDeliveries(req.query.qty) })
  } catch (error) { next(error) }
}

export const seedMocks = async (req, res, next) => {
  try {
    const bodyHasQty = req.body !== null
      && typeof req.body === 'object'
      && Object.hasOwn(req.body, 'qty')
    const requestedQty = bodyHasQty ? req.body.qty : req.query.qty
    res.status(201).json({ status: 'success', payload: await mocksService.seed(requestedQty) })
  } catch (error) { next(error) }
}
