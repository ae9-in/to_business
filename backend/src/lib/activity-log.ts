import { getDb, maybeObjectId } from './mongo.js'
import type { ActivityEntityType } from '../types/models.js'

export async function logActivity(input: {
  entityType: ActivityEntityType
  entityId: string
  action: string
  message: string
  actorId?: string
  metadata?: unknown
}) {
  await getDb().collection('activityLogs').insertOne({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    message: input.message,
    actorId: maybeObjectId(input.actorId),
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  })
}
