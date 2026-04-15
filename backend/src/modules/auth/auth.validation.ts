import { z } from 'zod'

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
}

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
}

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().optional(),
  }),
}
