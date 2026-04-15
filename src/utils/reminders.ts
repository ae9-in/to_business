import type {
  ActivityRecord,
  DeliveryRecord,
  NoteRecord,
  ReminderRecord,
  ReminderType,
  ShopFormValues,
  ShopRecord,
  ShopStatus,
} from '../types/shop'
import { statusOrder } from '../constants/app'

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function generateNextReminderDate(deliveryDate: string) {
  const delivery = new Date(deliveryDate)
  const reminderDate = new Date(delivery)
  reminderDate.setDate(reminderDate.getDate() + 30)
  return reminderDate.toISOString()
}

export function getReminderUrgency(dateValue: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateValue)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000)

  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'soon'
  return 'upcoming'
}

export function getReminderStatus(dateValue: string, completed = false) {
  if (completed) return 'Done'
  return getReminderUrgency(dateValue) === 'overdue' ? 'Overdue' : 'Pending'
}

export function isReminderActionable(reminder: ReminderRecord) {
  return reminder.status !== 'Done' && reminder.status !== 'Cancelled'
}

export function getActiveReminder(reminders: ReminderRecord[]) {
  return reminders
    .filter(isReminderActionable)
    .sort((left, right) => +new Date(left.dueDate) - +new Date(right.dueDate))[0] ?? null
}

export function getNextStatus(current: ShopStatus): ShopStatus {
  const currentIndex = statusOrder.indexOf(current)
  return statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)]
}

export function buildReminder(
  shopId: string,
  dueDate: string,
  type: ReminderType,
  assignedTo: string,
  note: string,
): ReminderRecord {
  return {
    id: createId('reminder'),
    shopId,
    title: `${type} reminder`,
    type,
    dueDate,
    status: getReminderStatus(dueDate),
    assignedTo,
    note,
  }
}

export function buildDelivery(
  shopId: string,
  product: string,
  date: string,
  notes: string,
  status: DeliveryRecord['status'] = 'Delivered',
): DeliveryRecord {
  return { id: createId('delivery'), shopId, product, date, status, notes }
}

export function buildActivity(
  type: ActivityRecord['type'],
  title: string,
  description: string,
  actor: string,
  createdAt = new Date().toISOString(),
): ActivityRecord {
  return { id: createId('activity'), type, title, description, createdAt, actor }
}

export function buildNote(body: string, author: string, createdAt?: string): NoteRecord {
  return {
    id: createId('note'),
    body,
    author,
    createdAt: createdAt ?? new Date().toISOString(),
  }
}

export function buildShopFromForm(values: ShopFormValues): ShopRecord {
  const id = createId('shop')
  const reminderDate =
    values.nextReminderDate || generateNextReminderDate(values.deliveryDate)
  const createdAt = new Date().toISOString()
  const reminder = buildReminder(
    id,
    reminderDate,
    'Monthly Revisit',
    values.assignedTo,
    values.reminderNotes,
  )
  const delivery = buildDelivery(
    id,
    values.deliveryProductType,
    values.deliveryDate,
    values.deliveryNotes,
  )
  return {
    id,
    shopName: values.shopName,
    ownerName: values.ownerName,
    businessType: values.businessType,
    productCategory: values.productCategory,
    description: values.description,
    fullAddress: values.fullAddress,
    area: values.area,
    city: values.city,
    pincode: values.pincode,
    phone1: values.phone1,
    phone2: values.phone2,
    email: values.email,
    deliveryDate: values.deliveryDate,
    deliveryProductType: values.deliveryProductType,
    deliveryNotes: values.deliveryNotes,
    nextReminderDate: reminderDate,
    reminderType: 'Monthly Revisit',
    reminderNotes: values.reminderNotes,
    status: values.status,
    priority: values.priority,
    source: values.source,
    assignedTo: values.assignedTo,
    createdAt,
    updatedAt: createdAt,
    deliveries: [delivery],
    reminders: [reminder],
    notes: values.description ? [buildNote(values.description, values.assignedTo, createdAt)] : [],
    activities: [
      buildActivity('created', 'Shop profile created', `New ${values.businessType.toLowerCase()} added to tracking.`, values.assignedTo, createdAt),
      buildActivity('delivery', 'Delivery recorded', `${values.deliveryProductType} delivered and ready for follow-up.`, values.assignedTo, createdAt),
      buildActivity('reminder', 'Reminder scheduled', `30-day reminder created from the delivery date.`, values.assignedTo, createdAt),
    ],
  }
}
