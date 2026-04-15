import { app } from './app.js'
import { env } from './config/env.js'
import { getMongoStatusDetail, setMongoStatus, verifyMongoConnection } from './lib/database.js'
import { logger } from './lib/logger.js'
import { connectMongo, disconnectMongo, isLocalMode } from './lib/mongo.js'
import { startJobs } from './jobs/index.js'

function printStartupMessage(port: number, mongoConnected: boolean) {
  console.log(mongoConnected && !isLocalMode() ? 'MongoDB connected' : getMongoStatusDetail())
  if (isLocalMode()) {
    console.log('MongoDB status: local fallback active')
  }
  console.log(`Server running at http://localhost:${port}`)
}

function listenWithFallback(port: number, attemptsLeft = 10): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      void verifyMongoConnection().then((mongoConnected) => {
        printStartupMessage(port, mongoConnected)
      })
      startJobs()

      const shutdown = async () => {
        logger.info('Shutting down server')
        await disconnectMongo()
        server.close(() => process.exit(0))
      }

      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
      resolve(port)
    })

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
        logger.warn({ port }, 'Port already in use, trying next port')
        server.close(() => {
          resolve(listenWithFallback(port + 1, attemptsLeft - 1))
        })
        return
      }

      logger.error(error, 'Server failed to start')
      reject(error)
    })
  })
}

async function bootstrap() {
  try {
    await connectMongo()
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : 'Unknown MongoDB connection error'
    setMongoStatus('local', `MongoDB unavailable: ${message}`)
    logger.warn({ mode: 'local-fallback', reason: message }, 'MongoDB initial connection failed')
  }

  await listenWithFallback(env.PORT)
}

void bootstrap().catch(async (error) => {
  logger.error(error, 'Failed to bootstrap backend')
  await disconnectMongo()
  process.exit(1)
})
