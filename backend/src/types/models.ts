export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const SHOP_STATUSES = [
  'NEW_LEAD',
  'CONTACTED',
  'INTERESTED',
  'ORDER_CONFIRMED',
  'DELIVERED',
  'FOLLOW_UP_REQUIRED',
  'REVISIT_NEEDED',
  'INACTIVE',
] as const
export type ShopStatus = (typeof SHOP_STATUSES)[number]

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Priority = (typeof PRIORITIES)[number]

export const REMINDER_STATUSES = [
  'PENDING',
  'UPCOMING',
  'DONE',
  'OVERDUE',
  'SNOOZED',
  'CANCELLED',
] as const
export type ReminderStatus = (typeof REMINDER_STATUSES)[number]

export const REMINDER_TYPES = [
  'DELIVERY_FOLLOWUP',
  'MONTHLY_REVISIT',
  'MANUAL_FOLLOWUP',
  'CALL',
  'VISIT',
] as const
export type ReminderType = (typeof REMINDER_TYPES)[number]

export const NOTE_TYPES = ['GENERAL', 'CALL', 'VISIT', 'DELIVERY', 'FOLLOW_UP'] as const
export type NoteType = (typeof NOTE_TYPES)[number]

export const ACTIVITY_ENTITY_TYPES = [
  'AUTH',
  'USER',
  'SHOP',
  'DELIVERY',
  'REMINDER',
  'NOTE',
  'DASHBOARD',
] as const
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number]
