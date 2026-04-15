import type { Request, Response } from 'express'
import { dashboardService } from './dashboard.service.js'

export class DashboardController {
  async summary(req: Request, res: Response) {
    const data = await dashboardService.getSummary(req.user)
    res.json({ success: true, data })
  }

  async upcomingReminders(req: Request, res: Response) {
    const data = await dashboardService.getUpcomingReminders(req.user)
    res.json({ success: true, data })
  }

  async overdueReminders(req: Request, res: Response) {
    const data = await dashboardService.getOverdueReminders(req.user)
    res.json({ success: true, data })
  }

  async recentShops(req: Request, res: Response) {
    const data = await dashboardService.getRecentShops(req.user)
    res.json({ success: true, data })
  }

  async statusBreakdown(req: Request, res: Response) {
    const data = await dashboardService.getStatusBreakdown(req.user)
    res.json({ success: true, data })
  }

  async monthlyDeliveries(req: Request, res: Response) {
    const data = await dashboardService.getMonthlyDeliveries(req.user)
    res.json({ success: true, data })
  }
}

export const dashboardController = new DashboardController()
