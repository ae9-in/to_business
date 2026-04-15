import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validate } from '../../middleware/validate.js'
import { notesController } from './notes.controller.js'
import {
  createNoteSchema,
  listNotesSchema,
  noteIdParamsSchema,
  updateNoteSchema,
} from './notes.validation.js'

export const noteRouter = Router()

noteRouter.use(authenticate)
noteRouter.get('/', validate(listNotesSchema), asyncHandler(notesController.list.bind(notesController)))
noteRouter.post('/', validate(createNoteSchema), asyncHandler(notesController.create.bind(notesController)))
noteRouter.patch('/:id', validate({ ...noteIdParamsSchema, ...updateNoteSchema }), asyncHandler(notesController.update.bind(notesController)))
noteRouter.delete('/:id', validate(noteIdParamsSchema), asyncHandler(notesController.remove.bind(notesController)))
