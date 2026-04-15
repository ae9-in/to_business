import { z } from 'zod'
import { NOTE_TYPES } from '../../types/models.js'

export const createNoteSchema = {
  body: z.object({
    shopId: z.string().optional(),
    content: z.string().min(2),
    noteType: z.enum(NOTE_TYPES).optional(),
  }),
}

export const updateNoteSchema = {
  body: z.object({
    content: z.string().min(2).optional(),
    noteType: z.enum(NOTE_TYPES).optional(),
  }),
}

export const listNotesSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    shopId: z.string().optional(),
  }),
}

export const noteIdParamsSchema = {
  params: z.object({ id: z.string().min(1) }),
}
