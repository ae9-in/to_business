import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authController } from './auth.controller.js'
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validation.js'

export const authRouter = Router()

authRouter.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)))
authRouter.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)))
authRouter.get('/me', authenticate, asyncHandler(authController.me.bind(authController)))
authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController)),
)
authRouter.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(authController.refresh.bind(authController)),
)
