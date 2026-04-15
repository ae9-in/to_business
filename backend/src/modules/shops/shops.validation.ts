import { z } from 'zod'
import { PRIORITIES, SHOP_STATUSES } from '../../types/models.js'

const phoneSchema = z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/)
const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value
const optionalStringSchema = z.preprocess(emptyStringToUndefined, z.string().trim().optional())
const optionalPhoneSchema = z.preprocess(emptyStringToUndefined, phoneSchema.optional())
const optionalEmailSchema = z.preprocess(emptyStringToUndefined, z.string().trim().email().optional())

export const shopIdParamsSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
}

export const listShopsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    status: z.enum(SHOP_STATUSES).optional(),
    area: z.string().optional(),
    city: z.string().optional(),
    productCategory: z.string().optional(),
    assignedStaffId: z.string().optional(),
    createdById: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'shopName']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
}

export const createShopSchema = {
  body: z.object({
    shopName: z.string().min(2),
    ownerName: z.string().min(2),
    businessType: z.string().min(2),
    description: optionalStringSchema,
    addressLine1: z.string().min(2),
    addressLine2: optionalStringSchema,
    area: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(4),
    phoneNumber1: phoneSchema,
    phoneNumber2: optionalPhoneSchema,
    email: optionalEmailSchema,
    productCategory: z.string().min(2),
    status: z.enum(SHOP_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    source: optionalStringSchema,
    assignedStaffId: optionalStringSchema,
    initialReminder: z
      .object({
        reminderDate: z.string().datetime(),
        title: z.string().min(2),
        description: optionalStringSchema,
      })
      .optional(),
  }),
}

export const updateShopSchema = {
  body: createShopSchema.body.partial(),
}

export const updateShopStatusSchema = {
  body: z.object({
    status: z.enum(SHOP_STATUSES),
    note: z.string().optional(),
  }),
}
