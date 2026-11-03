import { logger } from '../logging/logger.js'

const requestStartedAt = Symbol('requestStartedAt')
const requestLoggerAttached = Symbol('requestLoggerAttached')
const requestLogged = Symbol('requestLogged')

export const requestTimingMiddleware = (req, res, next) => {
  req[requestStartedAt] = process.hrtime.bigint()
  next()
}

const logRequestOnce = (req, statusCode, completed) => {
  if (req[requestLogged]) return
  req[requestLogged] = true

  const startedAt = req[requestStartedAt] ?? process.hrtime.bigint()
  logger.http('HTTP request completed', {
    event: 'http.request',
    method: req.method,
    route: req.path,
    statusCode,
    durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
    completed,
  })
}

export const logUntrackedErrorRequest = (req, statusCode) => {
  if (!req[requestLoggerAttached]) logRequestOnce(req, statusCode, true)
}

export const requestLoggerMiddleware = (req, res, next) => {
  req[requestLoggerAttached] = true
  const logRequest = () => logRequestOnce(req, res.statusCode, res.writableFinished)
  res.once('finish', logRequest)
  res.once('close', logRequest)
  next()
}
