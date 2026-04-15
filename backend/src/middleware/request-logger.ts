import type { RequestHandler } from 'express'
import pinoHttpImport from 'pino-http'
import { logger } from '../lib/logger.js'

const pinoHttp = pinoHttpImport as unknown as (options: Record<string, unknown>) => RequestHandler

export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req: { url?: string }) => req.url === '/health',
  },
  customLogLevel: (_req: unknown, res: { statusCode?: number }, error: unknown) => {
    if (error || (res.statusCode ?? 200) >= 500) return 'error'
    if ((res.statusCode ?? 200) >= 400) return 'warn'
    return 'silent'
  },
  customSuccessMessage: () => 'request handled',
  customErrorMessage: () => 'request failed',
})
