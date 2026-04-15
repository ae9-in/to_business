import type { Request, Response } from 'express'
import { reportsService } from './reports.service.js'

export class ReportsController {
  async shops(req: Request, res: Response) {
    const data = await reportsService.shopsReport(req.user)
    res.json({ success: true, data })
  }

  async deliveries(req: Request, res: Response) {
    const data = await reportsService.deliveriesReport(req.user)
    res.json({ success: true, data })
  }

  async reminders(req: Request, res: Response) {
    const data = await reportsService.remindersReport(req.user)
    res.json({ success: true, data })
  }

  async followups(req: Request, res: Response) {
    const data = await reportsService.followupsReport(req.user)
    res.json({ success: true, data })
  }
}

export const reportsController = new ReportsController()
