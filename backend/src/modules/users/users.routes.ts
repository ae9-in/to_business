import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validate } from '../../middleware/validate.js'
import { usersController } from './users.controller.js'
import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
  userIdParamsSchema,
} from './users.validation.js'

export const userRouter = Router()

userRouter.use(authenticate, authorize('SUPER_ADMIN', 'ADMIN'))

userRouter.get('/', validate(listUsersSchema), asyncHandler(usersController.list.bind(usersController)))
userRouter.post('/', validate(createUserSchema), asyncHandler(usersController.create.bind(usersController)))
userRouter.get('/:id', validate(userIdParamsSchema), asyncHandler(usersController.getById.bind(usersController)))
userRouter.patch('/:id', validate({ ...userIdParamsSchema, ...updateUserSchema }), asyncHandler(usersController.update.bind(usersController)))
userRouter.patch('/:id/activate', validate(userIdParamsSchema), asyncHandler(usersController.activate.bind(usersController)))
userRouter.patch('/:id/deactivate', validate(userIdParamsSchema), asyncHandler(usersController.deactivate.bind(usersController)))
userRouter.delete('/:id', validate(userIdParamsSchema), asyncHandler(usersController.remove.bind(usersController)))
