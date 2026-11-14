import { RouteNotFoundError } from '../errors/domain-error.js'

export const notFoundMiddleware = (req, res, next) => {
  next(new RouteNotFoundError())
}
