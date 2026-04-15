import type { ApiDelivery, ApiNote, ApiReminder, ApiShop } from '../types/api'
import type {
  ActivityRecord,
  DeliveryRecord,
  NoteRecord,
  ReminderRecord,
  ShopRecord,
} from '../types/shop'
import { getActiveReminder, isReminderActionable } from './reminders'

function formatAssignedStaff(assignedStaff?: ApiShop['assignedStaff'] | ApiReminder['assignedStaff']) {
  if (!assignedStaff) return 'Unassigned'

  const roleMap: Record<string, string> = {
    SUPER_ADMIN: 'Operations Head',
    ADMIN: 'Area Supervisor',
    STAFF: 'Sales Executive',
  }

  return assignedStaff.role ? roleMap[assignedStaff.role] ?? assignedStaff.fullName : assignedStaff.fullName
}

function mapStatus(status: string): ShopRecord['status'] {
  const statusMap: Record<string, ShopRecord['status']> = {
    NEW_LEAD: 'New Lead',
    CONTACTED: 'Contacted',
    INTERESTED: 'Interested',
    ORDER_CONFIRMED: 'Order Confirmed',
    DELIVERED: 'Delivered',
    FOLLOW_UP_REQUIRED: 'Follow-Up Required',
    REVISIT_NEEDED: 'Revisit Needed',
    INACTIVE: 'Inactive',
  }

  return statusMap[status] ?? 'New Lead'
}

function mapReminder(reminder: ApiReminder): ReminderRecord {
  return {
    id: reminder.id,
    shopId: reminder.shopId,
    deliveryId: reminder.deliveryId,
    title: reminder.title,
    type:
      reminder.reminderType === 'MONTHLY_REVISIT'
        ? 'Monthly Revisit'
        : reminder.reminderType === 'DELIVERY_FOLLOWUP'
          ? 'Delivery Follow-Up'
          : 'Relationship Check-In',
    dueDate: reminder.snoozedUntil || reminder.reminderDate,
    status:
      reminder.status === 'DONE'
        ? 'Done'
        : reminder.status === 'OVERDUE'
          ? 'Overdue'
          : reminder.status === 'SNOOZED'
            ? 'Snoozed'
            : reminder.status === 'CANCELLED'
              ? 'Cancelled'
              : 'Pending',
    assignedTo: formatAssignedStaff(reminder.assignedStaff),
    note: reminder.description || '',
  }
}

function mapDelivery(delivery: ApiDelivery, reminders: ReminderRecord[]): DeliveryRecord {
  const linkedReminder = reminders
    .filter((reminder) => reminder.deliveryId === delivery.id)
    .sort((left, right) => +new Date(left.dueDate) - +new Date(right.dueDate))[0]

  return {
    id: delivery.id,
    shopId: delivery.shopId,
    product: delivery.productType,
    quantity: delivery.quantity ?? null,
    price: delivery.price ?? null,
    billFileName: delivery.billFileName ?? null,
    date: delivery.deliveryDate,
    status: 'Delivered',
    notes: delivery.notes || '',
    reminderDate: linkedReminder?.dueDate,
    reminderId: linkedReminder?.id,
  }
}

function mapNote(note: ApiNote): NoteRecord {
  return {
    id: note.id,
    body: note.content,
    author: note.author?.fullName || 'Internal user',
    createdAt: note.createdAt,
  }
}

function mapActivities(shop: ApiShop): ActivityRecord[] {
  return [
    {
      id: `activity-${shop.id}`,
      type: 'created',
      title: 'Record synced from backend',
      description: `Live backend record for ${shop.shopName}.`,
      createdAt: shop.updatedAt,
      actor: shop.createdBy?.fullName || 'System',
    },
  ]
}

export function mapShop(shop: ApiShop): ShopRecord {
  const reminders = (shop.reminders || [])
    .map(mapReminder)
    .sort((left, right) => +new Date(left.dueDate) - +new Date(right.dueDate))
  const deliveries = (shop.deliveries || [])
    .map((delivery) => mapDelivery(delivery, reminders))
    .sort((left, right) => +new Date(right.date) - +new Date(left.date))
  const notes = (shop.notes || []).map(mapNote)
  const latestDelivery = deliveries[0]
  const activeReminder = getActiveReminder(reminders)
  const latestReminder =
    [...reminders].sort((left, right) => +new Date(right.dueDate) - +new Date(left.dueDate))[0] ??
    null
  const visibleReminder = activeReminder ?? latestReminder

  return {
    id: shop.id,
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    businessType: shop.businessType,
    productCategory: shop.productCategory,
    description: shop.description || '',
    fullAddress: [shop.addressLine1, shop.addressLine2].filter(Boolean).join(', '),
    area: shop.area,
    city: shop.city,
    pincode: shop.pincode,
    phone1: shop.phoneNumber1,
    phone2: shop.phoneNumber2 || '',
    email: shop.email || '',
    deliveryDate: latestDelivery?.date || shop.createdAt,
    deliveryProductType: latestDelivery?.product || shop.productCategory,
    deliveryNotes: latestDelivery?.notes || '',
    nextReminderDate: visibleReminder?.dueDate || latestDelivery?.reminderDate || shop.updatedAt,
    reminderType: visibleReminder?.type || 'Monthly Revisit',
    reminderNotes: visibleReminder?.note || '',
    status: mapStatus(shop.status),
    priority:
      shop.priority.charAt(0) + shop.priority.slice(1).toLowerCase() as ShopRecord['priority'],
    source: shop.source || '',
    assignedTo: formatAssignedStaff(shop.assignedStaff),
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
    deliveries,
    reminders: [...reminders].sort((left, right) => {
      if (isReminderActionable(left) !== isReminderActionable(right)) {
        return isReminderActionable(left) ? -1 : 1
      }
      return +new Date(left.dueDate) - +new Date(right.dueDate)
    }),
    notes,
    activities: mapActivities(shop),
  }
}
