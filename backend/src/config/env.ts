import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().transform((value) =>
    value.split(',').map((entry) => entry.trim()).filter(Boolean),
  ),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
  REMINDER_DAYS_BEFORE_VISIT: z.coerce.number().int().min(1).max(7).default(3),
  REMINDER_UPCOMING_WINDOW_DAYS: z.coerce.number().int().min(1).max(14).default(3),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_LOCAL_DB: z.coerce.boolean().default(false),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors
  throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`)
}

export const env = parsed.data
