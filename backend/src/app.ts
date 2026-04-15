import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { registerRoutes } from './routes.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { requestLogger } from './middleware/request-logger.js'

export const app = express()
const currentFilePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFilePath)
const frontendDistPath = path.resolve(currentDir, '../../../dist')
const frontendIndexPath = path.join(frontendDistPath, 'index.html')

function isLocalDevelopmentOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        env.CORS_ORIGIN.includes(origin) ||
        (env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin(origin))
      ) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(requestLogger)

app.use(
  '/api/v1/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

registerRoutes(app)

if (existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath))
  app.get(/^\/(?!api\/|health$).*/, (_req, res) => {
    res.sendFile(frontendIndexPath)
  })
}

app.use(notFoundHandler)
app.use(errorHandler)
