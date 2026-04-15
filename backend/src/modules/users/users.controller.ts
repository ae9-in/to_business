import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { usersService } from './users.service.js'

export class UsersController {
  async list(req: Request, res: Response) {
    const data = await usersService.list(req.query)
    res.json({ success: true, data })
  }

  async create(req: Request, res: Response) {
    const user = await usersService.create(req.user!.id, req.body)
    res.status(StatusCodes.CREATED).json({ success: true, data: user })
  }

  async getById(req: Request, res: Response) {
    const user = await usersService.getById(String(req.params.id))
    res.json({ success: true, data: user })
  }

  async update(req: Request, res: Response) {
    const user = await usersService.update(req.user!, String(req.params.id), req.body)
    res.json({ success: true, data: user })
  }

  async activate(req: Request, res: Response) {
    const user = await usersService.setActive(req.user!, String(req.params.id), true)
    res.json({ success: true, data: user })
  }

  async deactivate(req: Request, res: Response) {
    const user = await usersService.setActive(req.user!, String(req.params.id), false)
    res.json({ success: true, data: user })
  }

  async remove(req: Request, res: Response) {
    const user = await usersService.setActive(req.user!, String(req.params.id), false)
    res.json({ success: true, data: user, message: 'User disabled successfully' })
  }
}

export const usersController = new UsersController()
