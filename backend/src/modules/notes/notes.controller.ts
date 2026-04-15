import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { notesService } from './notes.service.js'

export class NotesController {
  async list(req: Request, res: Response) {
    const data = await notesService.list(req.query, req.user)
    res.json({ success: true, data })
  }

  async create(req: Request, res: Response) {
    const note = await notesService.create(req.user!, req.body)
    res.status(StatusCodes.CREATED).json({ success: true, data: note })
  }

  async update(req: Request, res: Response) {
    const note = await notesService.update(req.user!, String(req.params.id), req.body)
    res.json({ success: true, data: note })
  }

  async remove(req: Request, res: Response) {
    await notesService.remove(req.user!, String(req.params.id))
    res.json({ success: true, message: 'Note deleted successfully' })
  }
}

export const notesController = new NotesController()
