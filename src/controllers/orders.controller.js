import { ordersService } from '../services/orders.service.js'

export const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body)
    res.status(201).json({ status: 'success', payload: order })
  } catch (error) {
    next(error)
  }
}

export const getOrders = async (req, res, next) => {
  try {
    const orders = await ordersService.getOrders()
    res.json({ status: 'success', payload: orders })
  } catch (error) {
    next(error)
  }
}

export const getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id)
    res.json({ status: 'success', payload: order })
  } catch (error) {
    next(error)
  }
}

export const deliverOrder = async (req, res, next) => {
  try {
    const order = await ordersService.deliverOrder(req.params.id)
    res.json({ status: 'success', payload: order })
  } catch (error) {
    next(error)
  }
}
