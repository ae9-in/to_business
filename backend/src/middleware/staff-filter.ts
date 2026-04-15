import type { NextFunction, Request, Response } from 'express'

export function applyStaffScope(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role === 'STAFF') {
    req.query.assignedStaffId = req.user.id
  }
  next()
}
