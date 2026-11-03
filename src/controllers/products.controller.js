import { productsService } from '../services/products.service.js'

export const getProducts = async (req, res, next) => {
  try {
    res.json({ status: 'success', payload: await productsService.getAll() })
  } catch (error) { next(error) }
}

export const getProductById = async (req, res, next) => {
  try {
    res.json({ status: 'success', payload: await productsService.getById(req.params.id) })
  } catch (error) { next(error) }
}

export const createProduct = async (req, res, next) => {
  try {
    res.status(201).json({ status: 'success', payload: await productsService.create(req.body) })
  } catch (error) { next(error) }
}

export const updateProduct = async (req, res, next) => {
  try {
    res.json({ status: 'success', payload: await productsService.update(req.params.id, req.body) })
  } catch (error) { next(error) }
}

export const deleteProduct = async (req, res, next) => {
  try {
    await productsService.delete(req.params.id)
    res.status(204).end()
  } catch (error) { next(error) }
}
