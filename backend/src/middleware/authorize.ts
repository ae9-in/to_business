import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '../types/models.js'
import { StatusCodes } from 'http-status-codes'
import { AppError } from '../utils/app-error.js'

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(StatusCodes.UNAUTHORIZED, 'Authentication required'))
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(StatusCodes.FORBIDDEN, 'You do not have access to this resource'))
    }
    return next()
  }
}
