import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { dashboardController } from './dashboard.controller.js'

export const dashboardRouter = Router()

dashboardRouter.use(authenticate)
dashboardRouter.get('/summary', asyncHandler(dashboardController.summary.bind(dashboardController)))
dashboardRouter.get('/upcoming-reminders', asyncHandler(dashboardController.upcomingReminders.bind(dashboardController)))
dashboardRouter.get('/overdue-reminders', asyncHandler(dashboardController.overdueReminders.bind(dashboardController)))
dashboardRouter.get('/recent-shops', asyncHandler(dashboardController.recentShops.bind(dashboardController)))
dashboardRouter.get('/status-breakdown', asyncHandler(dashboardController.statusBreakdown.bind(dashboardController)))
dashboardRouter.get('/monthly-deliveries', asyncHandler(dashboardController.monthlyDeliveries.bind(dashboardController)))
