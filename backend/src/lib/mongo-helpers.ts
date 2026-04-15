import { ObjectId } from 'mongodb'
import { getDb, maybeObjectId, serializeMongo, toObjectId } from './mongo.js'

export function usersCollection() {
  return getDb().collection('users')
}

export function shopsCollection() {
  return getDb().collection('shops')
}

export function deliveriesCollection() {
  return getDb().collection('deliveries')
}

export function remindersCollection() {
  return getDb().collection('reminders')
}

export function notesCollection() {
  return getDb().collection('notes')
}

export function activityLogsCollection() {
  return getDb().collection('activityLogs')
}

export function refreshTokensCollection() {
  return getDb().collection('refreshTokens')
}

export function staffAssignmentHistoryCollection() {
  return getDb().collection('staffAssignmentHistory')
}

export function regexContains(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
}

export async function findUserById(id: string) {
  const user = await usersCollection().findOne({ _id: toObjectId(id) })
  return user ? serializeMongo(user) : null
}

export async function findUserByEmail(email: string) {
  const user = await usersCollection().findOne({ email })
  return user ? serializeMongo(user) : null
}

export async function attachShopRelations(shop: any) {
  if (!shop) return null

  const [assignedStaff, createdBy, deliveries, reminders, notes] = await Promise.all([
    shop.assignedStaffId ? usersCollection().findOne({ _id: toObjectId(shop.assignedStaffId) }) : null,
    shop.createdById ? usersCollection().findOne({ _id: toObjectId(shop.createdById) }) : null,
    deliveriesCollection().find({ shopId: toObjectId(shop._id) }).sort({ deliveryDate: -1 }).toArray(),
    remindersCollection().find({ shopId: toObjectId(shop._id) }).sort({ reminderDate: 1 }).toArray(),
    notesCollection().find({ shopId: toObjectId(shop._id) }).sort({ createdAt: -1 }).toArray(),
  ])

  const authorIds = notes.map((note) => note.authorId).filter(Boolean)
  const authors = authorIds.length
    ? await usersCollection()
        .find({ _id: { $in: authorIds } })
        .toArray()
    : []
  const authorMap = new Map(authors.map((author) => [author._id.toHexString(), author]))

  return serializeMongo({
    ...shop,
    assignedStaff,
    createdBy,
    deliveries,
    reminders,
    notes: notes.map((note) => ({
      ...note,
      author: note.authorId ? authorMap.get(note.authorId.toHexString()) ?? null : null,
    })),
  })
}

export async function attachDeliveryRelations(delivery: any) {
  if (!delivery) return null
  const [shop, reminders] = await Promise.all([
    shopsCollection().findOne({ _id: toObjectId(delivery.shopId) }),
    remindersCollection().find({ deliveryId: toObjectId(delivery._id) }).sort({ reminderDate: 1 }).toArray(),
  ])

  let assignedStaff = null
  if (shop?.assignedStaffId) {
    assignedStaff = await usersCollection().findOne({ _id: toObjectId(shop.assignedStaffId) })
  }

  return serializeMongo({
    ...delivery,
    shop: shop ? { ...shop, assignedStaff } : null,
    reminders,
  })
}

export async function attachReminderRelations(reminder: any) {
  if (!reminder) return null
  const [shop, assignedStaff] = await Promise.all([
    shopsCollection().findOne({ _id: toObjectId(reminder.shopId) }),
    reminder.assignedStaffId ? usersCollection().findOne({ _id: toObjectId(reminder.assignedStaffId) }) : null,
  ])

  return serializeMongo({
    ...reminder,
    shop,
    assignedStaff,
  })
}

export async function attachNoteRelations(note: any) {
  if (!note) return null
  const [author, shop] = await Promise.all([
    usersCollection().findOne({ _id: toObjectId(note.authorId) }),
    shopsCollection().findOne({ _id: toObjectId(note.shopId) }),
  ])

  return serializeMongo({
    ...note,
    author,
    shop,
  })
}

export function toStoredId(value: string | ObjectId | null | undefined) {
  return maybeObjectId(value instanceof ObjectId ? value.toHexString() : value ?? undefined)
}
