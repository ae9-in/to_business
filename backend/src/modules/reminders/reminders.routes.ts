import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validate } from '../../middleware/validate.js'
import { remindersController } from './reminders.controller.js'
import {
  completeReminderSchema,
  createReminderSchema,
  listRemindersSchema,
  reminderIdParamsSchema,
  rescheduleReminderSchema,
  snoozeReminderSchema,
  updateReminderSchema,
} from './reminders.validation.js'

export const reminderRouter = Router()

reminderRouter.use(authenticate)
reminderRouter.get('/', validate(listRemindersSchema), asyncHandler(remindersController.list.bind(remindersController)))
reminderRouter.get('/:id', validate(reminderIdParamsSchema), asyncHandler(remindersController.getById.bind(remindersController)))
reminderRouter.post('/', validate(createReminderSchema), asyncHandler(remindersController.create.bind(remindersController)))
reminderRouter.patch('/:id', validate({ ...reminderIdParamsSchema, ...updateReminderSchema }), asyncHandler(remindersController.update.bind(remindersController)))
reminderRouter.patch('/:id/complete', validate({ ...reminderIdParamsSchema, ...completeReminderSchema }), asyncHandler(remindersController.complete.bind(remindersController)))
reminderRouter.patch('/:id/snooze', validate({ ...reminderIdParamsSchema, ...snoozeReminderSchema }), asyncHandler(remindersController.snooze.bind(remindersController)))
reminderRouter.patch('/:id/reschedule', validate({ ...reminderIdParamsSchema, ...rescheduleReminderSchema }), asyncHandler(remindersController.reschedule.bind(remindersController)))
reminderRouter.patch('/:id/cancel', validate(reminderIdParamsSchema), asyncHandler(remindersController.cancel.bind(remindersController)))
