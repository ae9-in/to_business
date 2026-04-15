import {
  activityLogsCollection,
  deliveriesCollection,
  remindersCollection,
  shopsCollection,
} from '../../lib/mongo-helpers.js'
import { serializeMongo } from '../../lib/mongo.js'

function startOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function matchesStaff(item: any, actor?: Express.User) {
  if (actor?.role !== 'STAFF') return true
  return item.assignedStaffId?.toHexString?.() === actor.id
}

export class DashboardService {
  async getSummary(actor?: Express.User) {
    const currentMonth = startOfMonth()
    const [shops, deliveries, reminders] = await Promise.all([
      shopsCollection().find({ isArchived: false }).toArray(),
      deliveriesCollection().find({}).toArray(),
      remindersCollection().find({}).toArray(),
    ])

    const visibleShops = actor?.role === 'STAFF'
      ? shops.filter((shop) => shop.assignedStaffId?.toHexString?.() === actor.id)
      : shops
    const visibleShopIds = new Set(visibleShops.map((shop) => shop._id.toHexString()))
    const visibleDeliveries = actor?.role === 'STAFF'
      ? deliveries.filter((delivery) => visibleShopIds.has(delivery.shopId.toHexString()))
      : deliveries
    const visibleReminders = actor?.role === 'STAFF'
      ? reminders.filter((reminder) => reminder.assignedStaffId?.toHexString?.() === actor.id)
      : reminders

    return {
      totalShops: visibleShops.length,
      activeShops: visibleShops.filter((shop) => shop.status !== 'INACTIVE').length,
      inactiveShops: visibleShops.filter((shop) => shop.status === 'INACTIVE').length,
      newShopsThisMonth: visibleShops.filter((shop) => shop.createdAt >= currentMonth).length,
      deliveriesThisMonth: visibleDeliveries.filter((delivery) => delivery.deliveryDate >= currentMonth).length,
      pendingReminders: visibleReminders.filter((reminder) => reminder.status === 'PENDING').length,
      upcomingReminders: visibleReminders.filter((reminder) => reminder.status === 'UPCOMING').length,
      overdueReminders: visibleReminders.filter((reminder) => reminder.status === 'OVERDUE').length,
      remindersCompletedThisMonth: visibleReminders.filter(
        (reminder) => reminder.status === 'DONE' && reminder.completedAt && reminder.completedAt >= currentMonth,
      ).length,
    }
  }

  async getUpcomingReminders(actor?: Express.User) {
    const reminders = await remindersCollection()
      .find({ status: 'UPCOMING' })
      .sort({ reminderDate: 1 })
      .limit(10)
      .toArray()
    const shops = await shopsCollection().find({}).toArray()
    const shopMap = new Map(shops.map((shop) => [shop._id.toHexString(), shop]))

    return serializeMongo(
      reminders
        .filter((reminder) => matchesStaff(reminder, actor))
        .map((reminder) => ({
          ...reminder,
          shop: shopMap.get(reminder.shopId.toHexString()) ?? null,
        })),
    )
  }

  async getOverdueReminders(actor?: Express.User) {
    const reminders = await remindersCollection()
      .find({ status: 'OVERDUE' })
      .sort({ reminderDate: 1 })
      .limit(10)
      .toArray()
    const shops = await shopsCollection().find({}).toArray()
    const shopMap = new Map(shops.map((shop) => [shop._id.toHexString(), shop]))

    return serializeMongo(
      reminders
        .filter((reminder) => matchesStaff(reminder, actor))
        .map((reminder) => ({
          ...reminder,
          shop: shopMap.get(reminder.shopId.toHexString()) ?? null,
        })),
    )
  }

  async getRecentShops(actor?: Express.User) {
    const shops = await shopsCollection()
      .find({ isArchived: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return serializeMongo(
      actor?.role === 'STAFF'
        ? shops.filter((shop) => shop.assignedStaffId?.toHexString?.() === actor.id)
        : shops,
    )
  }

  async getStatusBreakdown(actor?: Express.User) {
    const shops = await shopsCollection().find({ isArchived: false }).toArray()
    const visibleShops = actor?.role === 'STAFF'
      ? shops.filter((shop) => shop.assignedStaffId?.toHexString?.() === actor.id)
      : shops

    const counts = visibleShops.reduce<Record<string, number>>((acc, shop) => {
      acc[shop.status] = (acc[shop.status] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  }

  async getMonthlyDeliveries(actor?: Express.User) {
    const [deliveries, shops] = await Promise.all([
      deliveriesCollection().find({}).toArray(),
      shopsCollection().find({}).toArray(),
    ])
    const shopMap = new Map(shops.map((shop) => [shop._id.toHexString(), shop]))
    const visible = actor?.role === 'STAFF'
      ? deliveries.filter((delivery) => shopMap.get(delivery.shopId.toHexString())?.assignedStaffId?.toHexString?.() === actor.id)
      : deliveries

    const grouped = new Map<string, number>()
    for (const delivery of visible) {
      const key = `${delivery.deliveryDate.getUTCFullYear()}-${String(delivery.deliveryDate.getUTCMonth() + 1).padStart(2, '0')}`
      grouped.set(key, (grouped.get(key) ?? 0) + 1)
    }

    return [...grouped.entries()].map(([month, count]) => ({ month, count }))
  }

  async getRecentActivity(actor?: Express.User) {
    const activity = await activityLogsCollection().find({}).sort({ createdAt: -1 }).limit(20).toArray()
    return serializeMongo(
      actor?.role === 'STAFF'
        ? activity.filter((entry) => entry.actorId?.toHexString?.() === actor.id)
        : activity,
    )
  }
}

export const dashboardService = new DashboardService()
