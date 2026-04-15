import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'
import { env } from '../config/env.js'
import { createLocalDb, initLocalStore } from './local-store.js'

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined
}

const mongoClient =
  global.__mongoClient ??
  new MongoClient(env.DATABASE_URL, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    retryWrites: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    socketTimeoutMS: 5000,
  })

if (env.NODE_ENV !== 'production') {
  global.__mongoClient = mongoClient
}

let localMode = false

export function getMongoClient() {
  return mongoClient
}

export function getDb() {
  return localMode ? createLocalDb() : mongoClient.db()
}

export async function connectMongo() {
  if (env.USE_LOCAL_DB) {
    localMode = true
    await initLocalStore()
    return getDb()
  }

  try {
    await mongoClient.connect()
    localMode = false
  } catch (error) {
    localMode = true
    await initLocalStore()
    throw error
  }
  return getDb()
}

export async function disconnectMongo() {
  if (!localMode) {
    await mongoClient.close()
  }
}

export function toObjectId(value: string | ObjectId) {
  return value instanceof ObjectId ? value : new ObjectId(value)
}

export function maybeObjectId(value?: string | null) {
  return value ? new ObjectId(value) : null
}

export function serializeMongo<T>(value: T): T {
  if (value instanceof ObjectId) {
    return value.toHexString() as T
  }
  if (value instanceof Date) {
    return value as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeMongo(item)) as T
  }
  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(input)) {
      if (key === '_id') {
        output.id = serializeMongo(entry)
        continue
      }
      output[key] = serializeMongo(entry)
    }
    return output as T
  }
  return value
}

export async function pingMongo() {
  await getDb().command({ ping: 1 })
}

export function isLocalMode() {
  return localMode
}
