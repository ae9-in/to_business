import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validate } from '../../middleware/validate.js'
import { deliveriesController } from './deliveries.controller.js'
import {
  createDeliverySchema,
  deliveryIdParamsSchema,
  listDeliveriesSchema,
  updateDeliverySchema,
} from './deliveries.validation.js'

export const deliveryRouter = Router()

deliveryRouter.use(authenticate)
deliveryRouter.get('/', validate(listDeliveriesSchema), asyncHandler(deliveriesController.list.bind(deliveriesController)))
deliveryRouter.get('/:id', validate(deliveryIdParamsSchema), asyncHandler(deliveriesController.getById.bind(deliveriesController)))
deliveryRouter.post('/', validate(createDeliverySchema), asyncHandler(deliveriesController.create.bind(deliveriesController)))
deliveryRouter.patch('/:id', validate({ ...deliveryIdParamsSchema, ...updateDeliverySchema }), asyncHandler(deliveriesController.update.bind(deliveriesController)))
deliveryRouter.delete('/:id', validate(deliveryIdParamsSchema), asyncHandler(deliveriesController.remove.bind(deliveriesController)))
