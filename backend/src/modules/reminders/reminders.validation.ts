import { z } from 'zod'
import {
  PRIORITIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
} from '../../types/models.js'

export const reminderIdParamsSchema = {
  params: z.object({ id: z.string().min(1) }),
}

export const listRemindersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.enum(REMINDER_STATUSES).optional(),
    assignedStaffId: z.string().optional(),
    reminderType: z.enum(REMINDER_TYPES).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    overdueOnly: z.coerce.boolean().optional(),
    upcomingOnly: z.coerce.boolean().optional(),
    completedOnly: z.coerce.boolean().optional(),
  }),
}

export const createReminderSchema = {
  body: z.object({
    shopId: z.string(),
    deliveryId: z.string().optional(),
    reminderDate: z.string().datetime(),
    reminderType: z.enum(REMINDER_TYPES),
    priority: z.enum(PRIORITIES).optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    assignedStaffId: z.string().optional(),
  }),
}

export const updateReminderSchema = {
  body: createReminderSchema.body.partial(),
}

export const completeReminderSchema = {
  body: z.object({
    completionNote: z.string().optional(),
  }),
}

export const snoozeReminderSchema = {
  body: z.object({
    snoozedUntil: z.string().datetime(),
    reason: z.string().optional(),
  }),
}

export const rescheduleReminderSchema = {
  body: z.object({
    reminderDate: z.string().datetime(),
    reason: z.string().optional(),
  }),
}
