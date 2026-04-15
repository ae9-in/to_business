export const SHOP_STATUSES = [
  'New Lead',
  'Contacted',
  'Interested',
  'Order Confirmed',
  'Delivered',
  'Follow-Up Required',
  'Revisit Needed',
  'Inactive',
] as const

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const

export const REMINDER_TYPES = [
  'Monthly Revisit',
  'Delivery Follow-Up',
  'Relationship Check-In',
] as const

export type ShopStatus = (typeof SHOP_STATUSES)[number]
export type Priority = (typeof PRIORITIES)[number]
export type ReminderType = (typeof REMINDER_TYPES)[number]

export type ActivityType =
  | 'created'
  | 'delivery'
  | 'reminder'
  | 'note'
  | 'status'
  | 'follow-up'

export interface DeliveryRecord {
  id: string
  shopId: string
  product: string
  quantity?: number | null
  price?: number | null
  billFileName?: string | null
  date: string
  status: 'Scheduled' | 'In Transit' | 'Delivered' | 'Delayed'
  notes: string
  reminderDate?: string
  reminderId?: string
}

export interface ReminderRecord {
  id: string
  shopId: string
  deliveryId?: string | null
  title: string
  type: ReminderType
  dueDate: string
  status: 'Pending' | 'Done' | 'Overdue' | 'Snoozed' | 'Cancelled'
  assignedTo: string
  note?: string
}

export interface ActivityRecord {
  id: string
  type: ActivityType
  title: string
  description: string
  createdAt: string
  actor: string
}

export interface NoteRecord {
  id: string
  body: string
  createdAt: string
  author: string
}

export interface ShopRecord {
  id: string
  shopName: string
  ownerName: string
  businessType: string
  productCategory: string
  description: string
  fullAddress: string
  area: string
  city: string
  pincode: string
  phone1: string
  phone2?: string
  email: string
  deliveryDate: string
  deliveryProductType: string
  deliveryNotes: string
  nextReminderDate: string
  reminderType: ReminderType
  reminderNotes: string
  status: ShopStatus
  priority: Priority
  source: string
  assignedTo: string
  createdAt: string
  updatedAt: string
  deliveries: DeliveryRecord[]
  reminders: ReminderRecord[]
  notes: NoteRecord[]
  activities: ActivityRecord[]
}

export interface ShopFormValues {
  shopName: string
  ownerName: string
  businessType: string
  productCategory: string
  description: string
  phone1: string
  phone2: string
  email: string
  fullAddress: string
  area: string
  city: string
  pincode: string
  deliveryDate: string
  deliveryProductType: string
  deliveryQuantity: string
  deliveryPrice: string
  deliveryBillFileName: string
  deliveryNotes: string
  nextReminderDate: string
  reminderNotes: string
  assignedTo: string
  status: ShopStatus
  priority: Priority
  source: string
}
