import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { remindersService } from './reminders.service.js'

export class RemindersController {
  async list(req: Request, res: Response) {
    const data = await remindersService.list(req.query, req.user)
    res.json({ success: true, data })
  }

  async getById(req: Request, res: Response) {
    const reminder = await remindersService.getById(String(req.params.id), req.user)
    res.json({ success: true, data: reminder })
  }

  async create(req: Request, res: Response) {
    const reminder = await remindersService.create(req.user!, req.body)
    res.status(StatusCodes.CREATED).json({ success: true, data: reminder })
  }

  async update(req: Request, res: Response) {
    const reminder = await remindersService.update(req.user!, String(req.params.id), req.body)
    res.json({ success: true, data: reminder })
  }

  async complete(req: Request, res: Response) {
    const reminder = await remindersService.complete(req.user!, String(req.params.id), req.body.completionNote)
    res.json({ success: true, data: reminder })
  }

  async snooze(req: Request, res: Response) {
    const reminder = await remindersService.snooze(req.user!, String(req.params.id), req.body.snoozedUntil, req.body.reason)
    res.json({ success: true, data: reminder })
  }

  async reschedule(req: Request, res: Response) {
    const reminder = await remindersService.reschedule(req.user!, String(req.params.id), req.body.reminderDate, req.body.reason)
    res.json({ success: true, data: reminder })
  }

  async cancel(req: Request, res: Response) {
    const reminder = await remindersService.cancel(req.user!, String(req.params.id))
    res.json({ success: true, data: reminder })
  }
}

export const remindersController = new RemindersController()
