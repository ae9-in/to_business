import { StatusCodes } from 'http-status-codes'
import { logActivity } from '../../lib/activity-log.js'
import {
  attachDeliveryRelations,
  deliveriesCollection,
  remindersCollection,
  shopsCollection,
  regexContains,
} from '../../lib/mongo-helpers.js'
import { maybeObjectId, serializeMongo, toObjectId } from '../../lib/mongo.js'
import { AppError } from '../../utils/app-error.js'
import { calculateReminderDate, getReminderStatusForDate } from '../../utils/date.js'
import { buildPaginationMeta, getPagination } from '../../utils/pagination.js'

export class DeliveriesService {
  async list(query: Record<string, unknown>, actor?: Express.User) {
    const { page, limit, skip } = getPagination({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    })
    const where: Record<string, unknown> = {
      ...(query.shopId ? { shopId: toObjectId(String(query.shopId)) } : {}),
      ...(query.productType ? { productType: regexContains(String(query.productType)) } : {}),
      ...(query.deliveryDateFrom || query.deliveryDateTo
        ? {
            deliveryDate: {
              ...(query.deliveryDateFrom ? { $gte: new Date(String(query.deliveryDateFrom)) } : {}),
              ...(query.deliveryDateTo ? { $lte: new Date(String(query.deliveryDateTo)) } : {}),
            },
          }
        : {}),
    }

    let deliveries = await deliveriesCollection().find(where).sort({ deliveryDate: -1 }).toArray()
    if (actor?.role === 'STAFF' || query.assignedStaffId) {
      const targetStaffId = query.assignedStaffId ? String(query.assignedStaffId) : actor?.id
      deliveries = await Promise.all(
        deliveries.map(async (delivery) => {
          const shop = await shopsCollection().findOne({ _id: toObjectId(delivery.shopId) })
          return shop?.assignedStaffId?.toHexString?.() === targetStaffId ? delivery : null
        }),
      ).then((items) => items.filter(Boolean) as any[])
    }

    const paged = deliveries.slice(skip, skip + limit)
    const items = await Promise.all(paged.map((item) => attachDeliveryRelations(item)))
    return { items, meta: buildPaginationMeta(deliveries.length, page, limit) }
  }

  async getById(id: string, actor?: Express.User) {
    const delivery = await attachDeliveryRelations(
      await deliveriesCollection().findOne({ _id: toObjectId(id) }),
    )
    if (!delivery || delivery.shop?.isArchived) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Delivery not found')
    }
    if (actor?.role === 'STAFF' && delivery.shop?.assignedStaffId !== actor.id) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You can only access assigned shop deliveries')
    }
    return delivery
  }

  async create(actor: Express.User, payload: Record<string, unknown>) {
    const shopId = String(payload.shopId)
    const shop = serializeMongo(
      await shopsCollection().findOne({ _id: toObjectId(shopId), isArchived: false }),
    )
    if (!shop) throw new AppError(StatusCodes.NOT_FOUND, 'Shop not found')
    if (actor.role === 'STAFF' && shop.assignedStaffId !== actor.id) {
      throw new AppError(StatusCodes.FORBIDDEN, 'Staff can only add deliveries for assigned shops')
    }

    const deliveryDate = new Date(String(payload.deliveryDate))
    const { reminderDate } = calculateReminderDate(deliveryDate)
    const now = new Date()

    const created = await deliveriesCollection().insertOne({
      shopId: toObjectId(shopId),
      deliveryDate,
      productType: String(payload.productType),
      quantity: payload.quantity !== undefined ? Number(payload.quantity) : null,
      price: payload.price !== undefined ? Number(payload.price) : null,
      billFileName: payload.billFileName ? String(payload.billFileName) : null,
      notes: payload.notes ? String(payload.notes) : null,
      createdById: toObjectId(actor.id),
      createdAt: now,
      updatedAt: now,
    })

    let reminder = await remindersCollection().findOne({
      deliveryId: created.insertedId,
      reminderType: 'MONTHLY_REVISIT',
    })

    if (!reminder) {
      const reminderResult = await remindersCollection().insertOne({
        shopId: toObjectId(shopId),
        deliveryId: created.insertedId,
        reminderDate,
        reminderType: 'MONTHLY_REVISIT',
        status: getReminderStatusForDate(reminderDate),
        priority: shop.priority ?? 'MEDIUM',
        title: `Monthly revisit for ${shop.shopName}`,
        description: `Auto-generated ${shop.productCategory} follow-up from delivery ${created.insertedId.toHexString()}.`,
        assignedStaffId: maybeObjectId(shop.assignedStaffId),
        createdBySystem: true,
        completedAt: null,
        snoozedUntil: null,
        createdAt: now,
        updatedAt: now,
      })
      reminder = await remindersCollection().findOne({ _id: reminderResult.insertedId })
    }

    const delivery = await this.getById(created.insertedId.toHexString(), actor)

    await logActivity({
      entityType: 'DELIVERY',
      entityId: delivery.id,
      action: 'DELIVERY_CREATED',
      message: 'Delivery recorded',
      actorId: actor.id,
      metadata: { shopId },
    })

    await logActivity({
      entityType: 'REMINDER',
      entityId: serializeMongo(reminder!).id,
      action: 'REMINDER_CREATED',
      message: 'Reminder auto-generated from delivery',
      actorId: actor.id,
      metadata: { deliveryId: delivery.id },
    })

    return { delivery, reminder: serializeMongo(reminder!) }
  }

  async update(actor: Express.User, id: string, payload: Record<string, unknown>) {
    const existing = await this.getById(id, actor)
    await deliveriesCollection().updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          ...(payload.deliveryDate ? { deliveryDate: new Date(String(payload.deliveryDate)) } : {}),
          ...(payload.productType ? { productType: String(payload.productType) } : {}),
          ...(payload.quantity !== undefined ? { quantity: payload.quantity ? Number(payload.quantity) : null } : {}),
          ...(payload.price !== undefined ? { price: payload.price ? Number(payload.price) : null } : {}),
          ...(payload.billFileName !== undefined ? { billFileName: payload.billFileName ? String(payload.billFileName) : null } : {}),
          ...(payload.notes !== undefined ? { notes: payload.notes ? String(payload.notes) : null } : {}),
          updatedAt: new Date(),
        },
      },
    )

    const delivery = await this.getById(id, actor)
    await logActivity({
      entityType: 'DELIVERY',
      entityId: id,
      action: 'DELIVERY_UPDATED',
      message: `Delivery updated for ${existing.shop.shopName}`,
      actorId: actor.id,
    })
    return delivery
  }

  async remove(actor: Express.User, id: string) {
    const existing = await this.getById(id, actor)
    if (actor.role === 'STAFF') {
      throw new AppError(StatusCodes.FORBIDDEN, 'Staff cannot delete deliveries')
    }

    await remindersCollection().updateMany(
      { deliveryId: toObjectId(id) },
      { $set: { status: 'CANCELLED', updatedAt: new Date() } },
    )
    await deliveriesCollection().deleteOne({ _id: toObjectId(id) })

    await logActivity({
      entityType: 'DELIVERY',
      entityId: id,
      action: 'DELIVERY_DELETED',
      message: `Delivery deleted for ${existing.shop.shopName}`,
      actorId: actor.id,
    })
  }
}

export const deliveriesService = new DeliveriesService()
