import { StatusCodes } from 'http-status-codes'
import { logActivity } from '../../lib/activity-log.js'
import { AppError } from '../../utils/app-error.js'
import { getReminderStatusForDate } from '../../utils/date.js'
import {
  attachReminderRelations,
  notesCollection,
  remindersCollection,
} from '../../lib/mongo-helpers.js'
import { toObjectId } from '../../lib/mongo.js'
import { toStoredId } from '../../lib/mongo-helpers.js'
import { type ReminderStatus, type ReminderType } from '../../types/models.js'
import { buildPaginationMeta, getPagination } from '../../utils/pagination.js'

const DONE_STATUS: ReminderStatus = 'DONE'
const OVERDUE_STATUS: ReminderStatus = 'OVERDUE'
const UPCOMING_STATUS: ReminderStatus = 'UPCOMING'
const SNOOZED_STATUS: ReminderStatus = 'SNOOZED'
const CANCELLED_STATUS: ReminderStatus = 'CANCELLED'

export class RemindersService {
  async list(query: Record<string, unknown>, actor?: Express.User) {
    const { page, limit, skip } = getPagination({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    })
    const where = {
      ...(query.status ? { status: query.status as ReminderStatus } : {}),
      ...(query.assignedStaffId ? { assignedStaffId: toObjectId(String(query.assignedStaffId)) } : {}),
      ...(query.reminderType ? { reminderType: query.reminderType as ReminderType } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            reminderDate: {
              ...(query.dateFrom ? { $gte: new Date(String(query.dateFrom)) } : {}),
              ...(query.dateTo ? { $lte: new Date(String(query.dateTo)) } : {}),
            },
          }
        : {}),
      ...(query.overdueOnly ? { status: OVERDUE_STATUS } : {}),
      ...(query.upcomingOnly ? { status: UPCOMING_STATUS } : {}),
      ...(query.completedOnly ? { status: DONE_STATUS } : {}),
      ...(actor?.role === 'STAFF' ? { assignedStaffId: toObjectId(actor.id) } : {}),
    }

    const [items, total] = await Promise.all([
      remindersCollection().find(where).sort({ reminderDate: 1 }).skip(skip).limit(limit).toArray(),
      remindersCollection().countDocuments(where),
    ])
    const hydrated = await Promise.all(items.map((item) => attachReminderRelations(item)))

    return { items: hydrated, meta: buildPaginationMeta(total, page, limit) }
  }

  async getById(id: string, actor?: Express.User) {
    const reminder = await attachReminderRelations(
      await remindersCollection().findOne({ _id: toObjectId(id) }),
    )
    if (!reminder) throw new AppError(StatusCodes.NOT_FOUND, 'Reminder not found')
    if (actor?.role === 'STAFF' && reminder.assignedStaffId !== actor.id) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You can only access assigned reminders')
    }
    return reminder
  }

  async create(actor: Express.User, payload: Record<string, unknown>) {
    const reminderDate = new Date(String(payload.reminderDate))
    const created = await remindersCollection().insertOne({
        shopId: toObjectId(String(payload.shopId)),
        deliveryId: toStoredId(payload.deliveryId ? String(payload.deliveryId) : null),
        reminderDate,
        reminderType: payload.reminderType as ReminderType,
        status: getReminderStatusForDate(reminderDate),
        priority: (payload.priority as any) ?? 'MEDIUM',
        title: String(payload.title),
        description: payload.description ? String(payload.description) : null,
        assignedStaffId: toStoredId(payload.assignedStaffId ? String(payload.assignedStaffId) : null),
        completedAt: null,
        snoozedUntil: null,
        createdBySystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
    const reminder = await attachReminderRelations(
      await remindersCollection().findOne({ _id: created.insertedId }),
    )

    await logActivity({
      entityType: 'REMINDER',
      entityId: reminder.id,
      action: 'REMINDER_CREATED',
      message: 'Manual reminder created',
      actorId: actor.id,
    })
    return reminder
  }

  async update(actor: Express.User, id: string, payload: Record<string, unknown>) {
    await this.getById(id, actor)
    await remindersCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: {
        ...(payload.reminderDate ? { reminderDate: new Date(String(payload.reminderDate)), status: getReminderStatusForDate(new Date(String(payload.reminderDate))) } : {}),
        ...(payload.reminderType ? { reminderType: payload.reminderType as ReminderType } : {}),
        ...(payload.priority ? { priority: payload.priority as any } : {}),
        ...(payload.title ? { title: String(payload.title) } : {}),
        ...(payload.description !== undefined ? { description: payload.description ? String(payload.description) : null } : {}),
        ...(payload.assignedStaffId !== undefined ? { assignedStaffId: toStoredId(payload.assignedStaffId ? String(payload.assignedStaffId) : null) } : {}),
        updatedAt: new Date(),
      } },
    )
    const reminder = await this.getById(id, actor)
    await logActivity({
      entityType: 'REMINDER',
      entityId: reminder.id,
      action: 'REMINDER_UPDATED',
      message: 'Reminder updated',
      actorId: actor.id,
    })
    return reminder
  }

  async complete(actor: Express.User, id: string, completionNote?: string) {
    const reminder = await this.getById(id, actor)
    await remindersCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: {
        status: DONE_STATUS,
        completedAt: new Date(),
        snoozedUntil: null,
        updatedAt: new Date(),
      } },
    )
    if (completionNote) {
      await notesCollection().insertOne({
          shopId: toObjectId(reminder.shopId),
          authorId: toObjectId(actor.id),
          content: completionNote,
          noteType: 'FOLLOW_UP',
          createdAt: new Date(),
          updatedAt: new Date(),
      })
    }
    await logActivity({
      entityType: 'REMINDER',
      entityId: id,
      action: 'REMINDER_COMPLETED',
      message: 'Reminder completed',
      actorId: actor.id,
      metadata: { completionNote },
    })
    return this.getById(id, actor)
  }

  async snooze(actor: Express.User, id: string, snoozedUntil: string, reason?: string) {
    await this.getById(id, actor)
    const date = new Date(snoozedUntil)
    await remindersCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: {
        snoozedUntil: date,
        status: SNOOZED_STATUS,
        updatedAt: new Date(),
      } },
    )
    await logActivity({
      entityType: 'REMINDER',
      entityId: id,
      action: 'REMINDER_SNOOZED',
      message: 'Reminder snoozed',
      actorId: actor.id,
      metadata: { snoozedUntil, reason },
    })
    return this.getById(id, actor)
  }

  async reschedule(actor: Express.User, id: string, reminderDate: string, reason?: string) {
    await this.getById(id, actor)
    const date = new Date(reminderDate)
    await remindersCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: {
        reminderDate: date,
        snoozedUntil: null,
        status: getReminderStatusForDate(date),
        updatedAt: new Date(),
      } },
    )
    await logActivity({
      entityType: 'REMINDER',
      entityId: id,
      action: 'REMINDER_RESCHEDULED',
      message: 'Reminder rescheduled',
      actorId: actor.id,
      metadata: { reminderDate, reason },
    })
    return this.getById(id, actor)
  }

  async cancel(actor: Express.User, id: string) {
    await this.getById(id, actor)
    await remindersCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: { status: CANCELLED_STATUS, updatedAt: new Date() } },
    )
    await logActivity({
      entityType: 'REMINDER',
      entityId: id,
      action: 'REMINDER_CANCELLED',
      message: 'Reminder cancelled',
      actorId: actor.id,
    })
    return this.getById(id, actor)
  }
}

export const remindersService = new RemindersService()
