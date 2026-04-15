import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { applyStaffScope } from '../../middleware/staff-filter.js'
import { requireShopAccess } from '../../middleware/staff-scope.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validate } from '../../middleware/validate.js'
import { createDeliverySchema } from '../deliveries/deliveries.validation.js'
import { createNoteSchema } from '../notes/notes.validation.js'
import { shopsController } from './shops.controller.js'
import {
  createShopSchema,
  listShopsSchema,
  shopIdParamsSchema,
  updateShopSchema,
  updateShopStatusSchema,
} from './shops.validation.js'

export const shopRouter = Router()

shopRouter.use(authenticate)
shopRouter.get('/', applyStaffScope, validate(listShopsSchema), asyncHandler(shopsController.list.bind(shopsController)))
shopRouter.post('/', authorize('SUPER_ADMIN', 'ADMIN'), validate(createShopSchema), asyncHandler(shopsController.create.bind(shopsController)))
shopRouter.get('/:id', validate(shopIdParamsSchema), requireShopAccess, asyncHandler(shopsController.getById.bind(shopsController)))
shopRouter.patch('/:id', validate({ ...shopIdParamsSchema, ...updateShopSchema }), requireShopAccess, asyncHandler(shopsController.update.bind(shopsController)))
shopRouter.patch('/:id/status', validate({ ...shopIdParamsSchema, ...updateShopStatusSchema }), requireShopAccess, asyncHandler(shopsController.updateStatus.bind(shopsController)))
shopRouter.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), validate(shopIdParamsSchema), asyncHandler(shopsController.remove.bind(shopsController)))
shopRouter.get('/:id/notes', validate(shopIdParamsSchema), requireShopAccess, asyncHandler(shopsController.listNotes.bind(shopsController)))
shopRouter.post('/:id/notes', validate({ ...shopIdParamsSchema, ...createNoteSchema }), requireShopAccess, asyncHandler(shopsController.addNote.bind(shopsController)))
shopRouter.get('/:id/deliveries', validate(shopIdParamsSchema), requireShopAccess, asyncHandler(shopsController.listDeliveries.bind(shopsController)))
shopRouter.post('/:id/deliveries', validate({ ...shopIdParamsSchema, ...createDeliverySchema }), requireShopAccess, asyncHandler(shopsController.addDelivery.bind(shopsController)))
shopRouter.get('/:id/reminders', validate(shopIdParamsSchema), requireShopAccess, asyncHandler(shopsController.listReminders.bind(shopsController)))
