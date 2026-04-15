import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { authService } from './auth.service.js'

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password)
    res.status(StatusCodes.OK).json({ success: true, data: result })
  }

  async logout(req: Request, res: Response) {
    await authService.logout(req.user!.id, req.body.refreshToken)
    res.status(StatusCodes.OK).json({ success: true, message: 'Logged out' })
  }

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id)
    res.json({ success: true, data: user })
  }

  async changePassword(req: Request, res: Response) {
    await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    )
    res.json({ success: true, message: 'Password updated' })
  }

  async refresh(req: Request, res: Response) {
    const token = req.body.refreshToken ?? req.cookies.refreshToken
    const result = await authService.refresh(token)
    res.json({ success: true, data: result })
  }
}

export const authController = new AuthController()
