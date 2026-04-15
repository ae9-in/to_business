import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { reportsController } from './reports.controller.js'

export const reportsRouter = Router()

reportsRouter.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'STAFF'))
reportsRouter.get('/shops', asyncHandler(reportsController.shops.bind(reportsController)))
reportsRouter.get('/deliveries', asyncHandler(reportsController.deliveries.bind(reportsController)))
reportsRouter.get('/reminders', asyncHandler(reportsController.reminders.bind(reportsController)))
reportsRouter.get('/followups', asyncHandler(reportsController.followups.bind(reportsController)))
