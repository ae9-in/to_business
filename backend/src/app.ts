import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { setMongoStatus, verifyMongoConnection } from './lib/database.js'
import { connectMongo } from './lib/mongo.js'
import { registerRoutes } from './routes.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { requestLogger } from './middleware/request-logger.js'

export const app = express()
const currentFilePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFilePath)
const frontendDistPathCandidates = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(currentDir, '../../../dist'),
  path.resolve(currentDir, '../dist'),
]
const frontendDistPath =
  frontendDistPathCandidates.find((candidate) =>
    existsSync(path.join(candidate, 'index.html')),
  ) ?? frontendDistPathCandidates[0]
const frontendIndexPath = path.join(frontendDistPath, 'index.html')
let appReadyPromise: Promise<void> | undefined

function isLocalDevelopmentOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

function ensureAppReady() {
  if (!appReadyPromise) {
    appReadyPromise = (async () => {
      try {
        await connectMongo()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message.split('\n')[0]
            : 'Unknown MongoDB connection error'
        setMongoStatus('local', `MongoDB unavailable: ${message}`)
      }

      await verifyMongoConnection()
    })()
  }

  return appReadyPromise
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
app.use(async (_req, _res, next) => {
  try {
    await ensureAppReady()
    next()
  } catch (error) {
    next(error)
  }
})

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
