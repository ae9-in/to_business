import type { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'
import { AppError } from '../utils/app-error.js'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const parserError = error as {
    type?: string
    status?: number
    statusCode?: number
    expose?: boolean
    body?: unknown
    message?: string
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error({ err: error, statusCode: error.statusCode }, error.message)
    } else {
      logger.warn({ statusCode: error.statusCode, message: error.message, details: error.details }, 'Request rejected')
    }

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    })
    return
  }

  if (error instanceof ZodError) {
    logger.warn({ details: error.flatten().fieldErrors }, 'Validation failed')
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      details: error.flatten().fieldErrors,
    })
    return
  }

  if (
    parserError?.type === 'entity.parse.failed' ||
    ((parserError?.status === StatusCodes.BAD_REQUEST ||
      parserError?.statusCode === StatusCodes.BAD_REQUEST) &&
      typeof parserError?.message === 'string' &&
      parserError.message.includes('JSON'))
  ) {
    logger.warn({ message: parserError.message }, 'Invalid JSON payload')
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Invalid JSON payload',
      details:
        env.NODE_ENV === 'production'
          ? undefined
          : 'Request body must be valid JSON.',
    })
    return
  }

  const rawMessage = String(error)
  if (
    rawMessage.includes('Server selection timeout') ||
    rawMessage.includes('No available servers') ||
    rawMessage.includes('received fatal alert')
  ) {
    logger.warn({ message: rawMessage.split('\n')[0] }, 'MongoDB connection failed')
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      message: 'MongoDB connection failed',
      details:
        env.NODE_ENV === 'production'
          ? undefined
          : 'Check DATABASE_URL, Atlas IP allowlist, and Node/SSL compatibility.',
    })
    return
  }

  logger.error({ err: error }, 'Unhandled error')
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error',
    details: env.NODE_ENV === 'production' ? undefined : String(error),
  })
}
