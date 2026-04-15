import { StatusCodes } from 'http-status-codes'
import { logActivity } from '../../lib/activity-log.js'
import {
  attachShopRelations,
  deliveriesCollection,
  notesCollection,
  remindersCollection,
  regexContains,
  shopsCollection,
  staffAssignmentHistoryCollection,
  usersCollection,
} from '../../lib/mongo-helpers.js'
import { maybeObjectId, serializeMongo, toObjectId } from '../../lib/mongo.js'
import type { Priority, ReminderType, ShopStatus } from '../../types/models.js'
import { AppError } from '../../utils/app-error.js'
import { getReminderStatusForDate } from '../../utils/date.js'
import { buildPaginationMeta, getPagination } from '../../utils/pagination.js'

export class ShopsService {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    })
    const search = String(query.search ?? '').trim()
    const where: Record<string, unknown> = {
      isArchived: false,
      ...(query.status ? { status: query.status as ShopStatus } : {}),
      ...(query.area ? { area: String(query.area) } : {}),
      ...(query.city ? { city: String(query.city) } : {}),
      ...(query.productCategory ? { productCategory: String(query.productCategory) } : {}),
      ...(query.assignedStaffId ? { assignedStaffId: toObjectId(String(query.assignedStaffId)) } : {}),
      ...(query.createdById ? { createdById: toObjectId(String(query.createdById)) } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { $gte: new Date(String(query.dateFrom)) } : {}),
              ...(query.dateTo ? { $lte: new Date(String(query.dateTo)) } : {}),
            },
          }
        : {}),
    }
    if (search) {
      where.$or = [
        { shopName: regexContains(search) },
        { ownerName: regexContains(search) },
        { phoneNumber1: regexContains(search) },
        { area: regexContains(search) },
        { city: regexContains(search) },
      ]
    }

    const sortBy = (query.sortBy as 'createdAt' | 'updatedAt' | 'shopName') ?? 'createdAt'
    const sortOrder = (query.sortOrder as 'asc' | 'desc') === 'asc' ? 1 : -1

    const [items, total] = await Promise.all([
      shopsCollection().find(where).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).toArray(),
      shopsCollection().countDocuments(where),
    ])

    const hydrated = await Promise.all(items.map((item) => attachShopRelations(item)))
    return { items: hydrated, meta: buildPaginationMeta(total, page, limit) }
  }

  async create(actor: Express.User, payload: Record<string, unknown>) {
    const assignedStaffId = payload.assignedStaffId ? String(payload.assignedStaffId) : null
    if (assignedStaffId) {
      const staff = await usersCollection().findOne({
        _id: toObjectId(assignedStaffId),
        role: 'STAFF',
        isActive: true,
      })
      if (!staff) throw new AppError(StatusCodes.BAD_REQUEST, 'Assigned staff not found')
    }

    const now = new Date()
    const created = await shopsCollection().insertOne({
      shopName: String(payload.shopName),
      ownerName: String(payload.ownerName),
      businessType: String(payload.businessType),
      description: payload.description ? String(payload.description) : null,
      addressLine1: String(payload.addressLine1),
      addressLine2: payload.addressLine2 ? String(payload.addressLine2) : null,
      area: String(payload.area),
      city: String(payload.city),
      state: String(payload.state),
      pincode: String(payload.pincode),
      phoneNumber1: String(payload.phoneNumber1),
      phoneNumber2: payload.phoneNumber2 ? String(payload.phoneNumber2) : null,
      email: payload.email ? String(payload.email) : null,
      productCategory: String(payload.productCategory),
      status: (payload.status as ShopStatus | undefined) ?? 'NEW_LEAD',
      priority: (payload.priority as Priority | undefined) ?? 'MEDIUM',
      source: payload.source ? String(payload.source) : null,
      assignedStaffId: maybeObjectId(assignedStaffId),
      createdById: toObjectId(actor.id),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    })

    if (assignedStaffId) {
      await staffAssignmentHistoryCollection().insertOne({
        shopId: created.insertedId,
        assignedStaffId: toObjectId(assignedStaffId),
        assignedById: toObjectId(actor.id),
        assignedAt: now,
        unassignedAt: null,
      })
    }

    if (payload.initialReminder) {
      const reminder = payload.initialReminder as Record<string, string>
      await remindersCollection().insertOne({
        shopId: created.insertedId,
        deliveryId: null,
        reminderDate: new Date(reminder.reminderDate),
        reminderType: 'MANUAL_FOLLOWUP' as ReminderType,
        status: getReminderStatusForDate(new Date(reminder.reminderDate)),
        priority: (payload.priority as Priority | undefined) ?? 'MEDIUM',
        title: reminder.title,
        description: reminder.description ?? null,
        assignedStaffId: maybeObjectId(assignedStaffId),
        completedAt: null,
        snoozedUntil: null,
        createdBySystem: false,
        createdAt: now,
        updatedAt: now,
      })
    }

    const shop = await this.getById(created.insertedId.toHexString())
    await logActivity({
      entityType: 'SHOP',
      entityId: shop.id,
      action: 'SHOP_CREATED',
      message: 'Shop created',
      actorId: actor.id,
      metadata: { assignedStaffId: shop.assignedStaffId },
    })
    return shop
  }

  async getById(id: string) {
    const shop = await shopsCollection().findOne({ _id: toObjectId(id), isArchived: false })
    const hydrated = await attachShopRelations(shop)
    if (!hydrated) throw new AppError(StatusCodes.NOT_FOUND, 'Shop not found')
    return hydrated
  }

  async update(actor: Express.User, id: string, payload: Record<string, unknown>) {
    const existing = await this.getById(id)
    const assignedStaffId =
      payload.assignedStaffId !== undefined
        ? payload.assignedStaffId
          ? String(payload.assignedStaffId)
          : null
        : existing.assignedStaffId

    await shopsCollection().updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          ...(payload.shopName ? { shopName: String(payload.shopName) } : {}),
          ...(payload.ownerName ? { ownerName: String(payload.ownerName) } : {}),
          ...(payload.businessType ? { businessType: String(payload.businessType) } : {}),
          ...(payload.description !== undefined ? { description: payload.description ? String(payload.description) : null } : {}),
          ...(payload.addressLine1 ? { addressLine1: String(payload.addressLine1) } : {}),
          ...(payload.addressLine2 !== undefined ? { addressLine2: payload.addressLine2 ? String(payload.addressLine2) : null } : {}),
          ...(payload.area ? { area: String(payload.area) } : {}),
          ...(payload.city ? { city: String(payload.city) } : {}),
          ...(payload.state ? { state: String(payload.state) } : {}),
          ...(payload.pincode ? { pincode: String(payload.pincode) } : {}),
          ...(payload.phoneNumber1 ? { phoneNumber1: String(payload.phoneNumber1) } : {}),
          ...(payload.phoneNumber2 !== undefined ? { phoneNumber2: payload.phoneNumber2 ? String(payload.phoneNumber2) : null } : {}),
          ...(payload.email !== undefined ? { email: payload.email ? String(payload.email) : null } : {}),
          ...(payload.productCategory ? { productCategory: String(payload.productCategory) } : {}),
          ...(payload.priority ? { priority: payload.priority as Priority } : {}),
          ...(payload.source !== undefined ? { source: payload.source ? String(payload.source) : null } : {}),
          ...(payload.assignedStaffId !== undefined ? { assignedStaffId: maybeObjectId(assignedStaffId) } : {}),
          updatedAt: new Date(),
        },
      },
    )

    if (payload.assignedStaffId !== undefined && existing.assignedStaffId !== assignedStaffId && assignedStaffId) {
      await staffAssignmentHistoryCollection().insertOne({
        shopId: toObjectId(id),
        assignedStaffId: toObjectId(assignedStaffId),
        assignedById: toObjectId(actor.id),
        assignedAt: new Date(),
        unassignedAt: null,
      })
    }

    const shop = await this.getById(id)
    await logActivity({
      entityType: 'SHOP',
      entityId: shop.id,
      action: 'SHOP_UPDATED',
      message: 'Shop updated',
      actorId: actor.id,
    })

    return shop
  }

  async updateStatus(actor: Express.User, id: string, nextStatus: ShopStatus, note?: string) {
    const shop = await this.getById(id)

    await shopsCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: { status: nextStatus, updatedAt: new Date() } },
    )

    await logActivity({
      entityType: 'SHOP',
      entityId: id,
      action: 'SHOP_STATUS_CHANGED',
      message: `Shop status changed from ${shop.status} to ${nextStatus}`,
      actorId: actor.id,
      metadata: { note },
    })

    if (note) {
      await notesCollection().insertOne({
        shopId: toObjectId(id),
        authorId: toObjectId(actor.id),
        content: note,
        noteType: 'FOLLOW_UP',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return this.getById(id)
  }

  async archive(actor: Express.User, id: string) {
    const shop = await this.getById(id)
    await shopsCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: { isArchived: true, updatedAt: new Date() } },
    )
    await logActivity({
      entityType: 'SHOP',
      entityId: id,
      action: 'SHOP_ARCHIVED',
      message: `Shop ${shop.shopName} archived`,
      actorId: actor.id,
    })
  }

  async listNotes(shopId: string) {
    await this.getById(shopId)
    const notes = await notesCollection().find({ shopId: toObjectId(shopId) }).sort({ createdAt: -1 }).toArray()
    const hydrated = await Promise.all(notes.map(async (note) => {
      const author = note.authorId ? await usersCollection().findOne({ _id: toObjectId(note.authorId) }) : null
      return serializeMongo({ ...note, author })
    }))
    return hydrated
  }

  async listDeliveries(shopId: string) {
    await this.getById(shopId)
    return serializeMongo(
      await deliveriesCollection().find({ shopId: toObjectId(shopId) }).sort({ deliveryDate: -1 }).toArray(),
    )
  }

  async listReminders(shopId: string) {
    await this.getById(shopId)
    return serializeMongo(
      await remindersCollection().find({ shopId: toObjectId(shopId) }).sort({ reminderDate: 1 }).toArray(),
    )
  }
}

export const shopsService = new ShopsService()
