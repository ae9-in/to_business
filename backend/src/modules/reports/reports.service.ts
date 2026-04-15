import {
  deliveriesCollection,
  remindersCollection,
  shopsCollection,
} from '../../lib/mongo-helpers.js'
import { serializeMongo } from '../../lib/mongo.js'

export class ReportsService {
  async shopsReport(actor?: Express.User) {
    const shops = await shopsCollection().find({ isArchived: false }).toArray()
    const visible = actor?.role === 'STAFF'
      ? shops.filter((shop) => shop.assignedStaffId?.toHexString?.() === actor.id)
      : shops

    const group = (key: string) =>
      Object.entries(
        visible.reduce<Record<string, number>>((acc, item) => {
          const value = item[key] ?? 'UNKNOWN'
          acc[value] = (acc[value] ?? 0) + 1
          return acc
        }, {}),
      ).map(([value, count]) => ({ [key]: value, _count: { [key]: count } }))

    return {
      byArea: group('area'),
      byStatus: group('status'),
      byCategory: group('productCategory'),
    }
  }

  async deliveriesReport(actor?: Express.User) {
    const [deliveries, shops] = await Promise.all([
      deliveriesCollection().find({}).sort({ deliveryDate: -1 }).toArray(),
      shopsCollection().find({}).toArray(),
    ])
    const shopMap = new Map(shops.map((shop) => [shop._id.toHexString(), shop]))
    const visible = actor?.role === 'STAFF'
      ? deliveries.filter((delivery) => shopMap.get(delivery.shopId.toHexString())?.assignedStaffId?.toHexString?.() === actor.id)
      : deliveries

    return serializeMongo(
      visible.map((delivery) => ({
        ...delivery,
        shop: shopMap.get(delivery.shopId.toHexString()) ?? null,
      })),
    )
  }

  async remindersReport(actor?: Express.User) {
    const reminders = await remindersCollection().find({}).toArray()
    const visible = actor?.role === 'STAFF'
      ? reminders.filter((reminder) => reminder.assignedStaffId?.toHexString?.() === actor.id)
      : reminders

    const byStatus = Object.entries(
      visible.reduce<Record<string, number>>((acc, reminder) => {
        acc[reminder.status] = (acc[reminder.status] ?? 0) + 1
        return acc
      }, {}),
    ).map(([status, count]) => ({ status, _count: { status: count } }))

    const overdueByStaff = Object.entries(
      visible
        .filter((reminder) => reminder.status === 'OVERDUE')
        .reduce<Record<string, number>>((acc, reminder) => {
          const key = reminder.assignedStaffId?.toHexString?.() ?? 'UNASSIGNED'
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {}),
    ).map(([assignedStaffId, count]) => ({ assignedStaffId, _count: { assignedStaffId: count } }))

    return { byStatus, overdueByStaff }
  }

  async followupsReport(actor?: Express.User) {
    const reminders = await remindersCollection().find({}).toArray()
    const visible = actor?.role === 'STAFF'
      ? reminders.filter((reminder) => reminder.assignedStaffId?.toHexString?.() === actor.id)
      : reminders

    const total = visible.length
    const completed = visible.filter((item) => item.status === 'DONE').length
    const overdue = visible.filter((item) => item.status === 'OVERDUE').length

    return {
      total,
      completed,
      overdue,
      completionRate: total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2)),
    }
  }
}

export const reportsService = new ReportsService()
