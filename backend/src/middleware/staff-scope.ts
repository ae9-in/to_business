import type { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { shopsCollection } from '../lib/mongo-helpers.js'
import { toObjectId } from '../lib/mongo.js'
import { AppError } from '../utils/app-error.js'

export async function requireShopAccess(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError(StatusCodes.UNAUTHORIZED, 'Authentication required'))
  if (req.user.role !== 'STAFF') return next()

  const shopId = String(req.params.id ?? req.params.shopId ?? '')
  if (!shopId) return next()

  const shop = await shopsCollection().findOne({
    _id: toObjectId(shopId),
    assignedStaffId: toObjectId(req.user.id),
    isArchived: false,
  })

  if (!shop) {
    return next(new AppError(StatusCodes.FORBIDDEN, 'Staff can only access assigned shops'))
  }

  return next()
}
