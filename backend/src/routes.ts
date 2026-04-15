import type { Express } from 'express'
import { authRouter } from './modules/auth/auth.routes.js'
import { userRouter } from './modules/users/users.routes.js'
import { shopRouter } from './modules/shops/shops.routes.js'
import { deliveryRouter } from './modules/deliveries/deliveries.routes.js'
import { reminderRouter } from './modules/reminders/reminders.routes.js'
import { noteRouter } from './modules/notes/notes.routes.js'
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js'
import { reportsRouter } from './modules/reports/reports.routes.js'
import { getMongoStatus, getMongoStatusDetail } from './lib/database.js'

export function registerRoutes(app: Express) {
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'OK',
      database: {
        status: getMongoStatus(),
        detail: getMongoStatusDetail(),
      },
    })
  })

  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/users', userRouter)
  app.use('/api/v1/staff', userRouter)
  app.use('/api/v1/shops', shopRouter)
  app.use('/api/v1/deliveries', deliveryRouter)
  app.use('/api/v1/reminders', reminderRouter)
  app.use('/api/v1/notes', noteRouter)
  app.use('/api/v1/dashboard', dashboardRouter)
  app.use('/api/v1/reports', reportsRouter)
}
