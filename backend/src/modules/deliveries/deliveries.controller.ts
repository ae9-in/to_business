import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { deliveriesService } from './deliveries.service.js'

export class DeliveriesController {
  async list(req: Request, res: Response) {
    const data = await deliveriesService.list(req.query, req.user)
    res.json({ success: true, data })
  }

  async getById(req: Request, res: Response) {
    const delivery = await deliveriesService.getById(String(req.params.id), req.user)
    res.json({ success: true, data: delivery })
  }

  async create(req: Request, res: Response) {
    const delivery = await deliveriesService.create(req.user!, req.body)
    res.status(StatusCodes.CREATED).json({ success: true, data: delivery })
  }

  async update(req: Request, res: Response) {
    const delivery = await deliveriesService.update(req.user!, String(req.params.id), req.body)
    res.json({ success: true, data: delivery })
  }

  async remove(req: Request, res: Response) {
    await deliveriesService.remove(req.user!, String(req.params.id))
    res.json({ success: true, message: 'Delivery deleted successfully' })
  }
}

export const deliveriesController = new DeliveriesController()
