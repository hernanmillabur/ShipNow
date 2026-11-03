import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import DailyRotateFile from 'winston-daily-rotate-file'
import winston from 'winston'
import { config } from '../config/env.config.js'

const levels = Object.freeze({
  fatal: 0,
  error: 1,
  warning: 2,
  http: 3,
  info: 4,
  debug: 5,
})

const logDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../logs', config.nodeEnv)
mkdirSync(logDirectory, { recursive: true })

const sensitiveKey = /(password|passwd|token|secret|authorization|cookie|credential|mongo(?:db)?[_-]?uri|connection.?(?:string|uri)|api.?key|^uri$)/i
const secretPatterns = [
  /mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi,
  /\b(bearer)\s+[a-z0-9._~+/-]+=*/gi,
  /\b(password|passwd|token|secret|authorization|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
]

const redactString = (value) => secretPatterns.reduce(
  (sanitized, pattern) => sanitized.replace(pattern, (match, label) => (
    label ? `${label}=[REDACTED]` : '[REDACTED]'
  )),
  value,
)

const redactValue = (value, key = '') => {
  if (sensitiveKey.test(key)) return '[REDACTED]'
  if (typeof value === 'string') return redactString(value)
  if (Array.isArray(value)) return value.map((item) => redactValue(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      redactValue(childValue, childKey),
    ]))
  }
  return value
}

const redactFormat = winston.format((info) => {
  for (const key of Object.keys(info)) info[key] = redactValue(info[key], key)
  return info
})

const logLevel = config.nodeEnv === 'production' ? 'info' : 'debug'
const fileOptions = {
  dirname: logDirectory,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: false,
}

const combinedTransport = new DailyRotateFile({
  ...fileOptions,
  filename: 'combined.log',
  level: 'debug',
})

const errorTransport = new DailyRotateFile({
  ...fileOptions,
  filename: 'error.log',
  level: 'error',
})

for (const transport of [combinedTransport, errorTransport]) {
  transport.on('error', () => {
    process.stderr.write('Winston file transport failed.\n')
  })
}

export const logger = winston.createLogger({
  levels,
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    combinedTransport,
    errorTransport,
  ],
})

export const safeErrorMetadata = (error) => {
  const cause = error?.cause
  const metadata = {
    errorName: error?.name,
    errorCode: error?.code,
    causeName: cause?.name,
    causeCode: cause?.code,
  }

  if (config.nodeEnv !== 'production') {
    metadata.errorStack = error?.stack
    metadata.causeStack = cause?.stack
  }

  return metadata
}
