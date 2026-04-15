import { z } from 'zod'
import { USER_ROLES } from '../../types/models.js'

const phoneSchema = z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/).optional()

export const listUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    role: z.enum(USER_ROLES).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
}

export const createUserSchema = {
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(USER_ROLES),
    phone: phoneSchema,
    isActive: z.boolean().optional(),
  }),
}

export const updateUserSchema = {
  body: createUserSchema.body.partial().omit({ password: true }).extend({
    password: z.string().min(8).optional(),
  }),
}

export const userIdParamsSchema = {
  params: z.object({ id: z.string().min(1) }),
}
