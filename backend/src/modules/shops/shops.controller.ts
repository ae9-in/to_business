import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { deliveriesService } from '../deliveries/deliveries.service.js'
import { notesService } from '../notes/notes.service.js'
import { shopsService } from './shops.service.js'

export class ShopsController {
  async list(req: Request, res: Response) {
    const data = await shopsService.list(req.query)
    res.json({ success: true, data })
  }

  async create(req: Request, res: Response) {
    const shop = await shopsService.create(req.user!, req.body)
    res.status(StatusCodes.CREATED).json({ success: true, data: shop })
  }

  async getById(req: Request, res: Response) {
    const shop = await shopsService.getById(String(req.params.id))
    res.json({ success: true, data: shop })
  }

  async update(req: Request, res: Response) {
    const shop = await shopsService.update(req.user!, String(req.params.id), req.body)
    res.json({ success: true, data: shop })
  }

  async updateStatus(req: Request, res: Response) {
    const shop = await shopsService.updateStatus(
      req.user!,
      String(req.params.id),
      req.body.status,
      req.body.note,
    )
    res.json({ success: true, data: shop })
  }

  async remove(req: Request, res: Response) {
    await shopsService.archive(req.user!, String(req.params.id))
    res.json({ success: true, message: 'Shop archived successfully' })
  }

  async listNotes(req: Request, res: Response) {
    const notes = await shopsService.listNotes(String(req.params.id))
    res.json({ success: true, data: notes })
  }

  async addNote(req: Request, res: Response) {
    const note = await notesService.create(req.user!, { ...req.body, shopId: String(req.params.id) })
    res.status(StatusCodes.CREATED).json({ success: true, data: note })
  }

  async listDeliveries(req: Request, res: Response) {
    const deliveries = await shopsService.listDeliveries(String(req.params.id))
    res.json({ success: true, data: deliveries })
  }

  async addDelivery(req: Request, res: Response) {
    const delivery = await deliveriesService.create(req.user!, {
      ...req.body,
      shopId: String(req.params.id),
    })
    res.status(StatusCodes.CREATED).json({ success: true, data: delivery })
  }

  async listReminders(req: Request, res: Response) {
    const reminders = await shopsService.listReminders(String(req.params.id))
    res.json({ success: true, data: reminders })
  }
}

export const shopsController = new ShopsController()
