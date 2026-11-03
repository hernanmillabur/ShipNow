import { DomainError } from '../errors/domain-error.js'
import { logger } from '../logging/logger.js'
import { config } from '../config/env.config.js'

const testLevels = ['debug', 'http', 'info', 'warning', 'error', 'fatal']

export const testLogging = (req, res, next) => {
  if (config.nodeEnv === 'production') {
    return next(new DomainError('LOGGER_TEST_DISABLED'))
  }

  for (const level of testLevels) {
    logger.log({
      level,
      message: level === 'fatal' ? 'Simulated fatal log level test' : 'Logger level test',
      event: 'logger.test',
      simulated: level === 'fatal',
    })
  }

  res.json({ status: 'success', payload: { levels: testLevels } })
}
