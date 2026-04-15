import { isLocalMode, pingMongo } from './mongo.js'

export type MongoStatus = 'connected' | 'disconnected' | 'local'
let mongoStatus: MongoStatus = 'disconnected'
let mongoStatusDetail = 'MongoDB not checked yet'

export function getMongoStatus(): MongoStatus {
  return mongoStatus
}

export function getMongoStatusDetail() {
  return mongoStatusDetail
}

export async function verifyMongoConnection() {
  try {
    await pingMongo()
    mongoStatus = isLocalMode() ? 'local' : 'connected'
    mongoStatusDetail = isLocalMode()
      ? 'Using local persistent datastore'
      : 'Connected to MongoDB'
    return true
  } catch (error) {
    mongoStatus = 'disconnected'
    mongoStatusDetail = error instanceof Error ? error.message.split('\n')[0] : 'MongoDB connection failed'
    return false
  }
}

export function setMongoStatus(status: MongoStatus, detail?: string) {
  mongoStatus = status
  if (detail) {
    mongoStatusDetail = detail
  }
}
