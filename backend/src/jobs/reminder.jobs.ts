import {
  deliveriesCollection,
  remindersCollection,
  shopsCollection,
} from '../lib/mongo-helpers.js'
import { maybeObjectId, serializeMongo, toObjectId } from '../lib/mongo.js'
import { logActivity } from '../lib/activity-log.js'
import { calculateReminderDate, getReminderStatusForDate } from '../utils/date.js'

export async function runReminderStatusJob(now = new Date()) {
  const reminders = await remindersCollection()
    .find({ status: { $in: ['PENDING', 'UPCOMING', 'SNOOZED'] } })
    .toArray()

  await Promise.all(
    reminders.map(async (reminder) => {
      const nextStatus = getReminderStatusForDate(reminder.snoozedUntil ?? reminder.reminderDate, now)
      if (nextStatus !== reminder.status) {
        await remindersCollection().updateOne(
          { _id: reminder._id },
          { $set: { status: nextStatus, updatedAt: new Date() } },
        )
      }
    }),
  )
}

export async function runReminderIntegrityJob() {
  const deliveries = await deliveriesCollection().find({}).toArray()

  await Promise.all(
    deliveries.map(async (delivery) => {
      const [shop, existing] = await Promise.all([
        shopsCollection().findOne({ _id: toObjectId(delivery.shopId) }),
        remindersCollection().findOne({
          deliveryId: delivery._id,
          reminderType: 'MONTHLY_REVISIT',
        }),
      ])

      if (existing || !shop) return

      const { reminderDate } = calculateReminderDate(delivery.deliveryDate)
      const status = getReminderStatusForDate(reminderDate)

      const result = await remindersCollection().insertOne({
          shopId: toObjectId(delivery.shopId),
          deliveryId: delivery._id,
          reminderDate,
          reminderType: 'MONTHLY_REVISIT',
          status,
          priority: shop.priority,
          title: `Monthly revisit for ${shop.shopName}`,
          description: 'Auto-generated integrity reminder from delivery record.',
          assignedStaffId: maybeObjectId(serializeMongo(shop).assignedStaffId),
          createdBySystem: true,
          completedAt: null,
          snoozedUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
      })

      await logActivity({
        entityType: 'REMINDER',
        entityId: result.insertedId.toHexString(),
        action: 'REMINDER_INTEGRITY_CREATED',
        message: 'Missing reminder was created by integrity job.',
        metadata: { deliveryId: delivery._id.toHexString() },
      })
    }),
  )
}
