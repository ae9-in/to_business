import { StatusCodes } from 'http-status-codes'
import { logActivity } from '../../lib/activity-log.js'
import { AppError } from '../../utils/app-error.js'
import { usersCollection } from '../../lib/mongo-helpers.js'
import { serializeMongo, toObjectId } from '../../lib/mongo.js'
import type { UserRole } from '../../types/models.js'
import { hashPassword } from '../../utils/password.js'
import { buildPaginationMeta, getPagination } from '../../utils/pagination.js'

export class UsersService {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    })
    const search = String(query.search ?? '').trim()
    const where = {
      ...(search
        ? {
            $or: [
              { fullName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role as UserRole } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === true || query.isActive === 'true' } : {}),
    }

    const [items, total] = await Promise.all([
      usersCollection().find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      usersCollection().countDocuments(where),
    ])

    return { items: serializeMongo(items), meta: buildPaginationMeta(total, page, limit) }
  }

  async create(actorId: string, payload: { fullName: string; email: string; password: string; role: UserRole; phone?: string; isActive?: boolean }) {
    const existing = await usersCollection().findOne({ email: payload.email })
    if (existing) throw new AppError(StatusCodes.CONFLICT, 'Email is already in use')

    const created = await usersCollection().insertOne({
        fullName: payload.fullName,
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        role: payload.role,
        phone: payload.phone,
        isActive: payload.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
    const user = serializeMongo(await usersCollection().findOne({ _id: created.insertedId }))
    if (!user) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user')

    await logActivity({
      entityType: 'USER',
      entityId: user.id,
      action: 'USER_CREATED',
      message: 'User account created',
      actorId,
      metadata: { role: user.role },
    })

    return user
  }

  async getById(id: string) {
    const user = serializeMongo(await usersCollection().findOne({ _id: toObjectId(id) }))
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found')
    return user
  }

  async update(actor: Express.User, id: string, payload: Record<string, unknown>) {
    const existing = serializeMongo(await usersCollection().findOne({ _id: toObjectId(id) }))
    if (!existing) throw new AppError(StatusCodes.NOT_FOUND, 'User not found')
    if (existing.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new AppError(StatusCodes.FORBIDDEN, 'Only super admin can modify this account')
    }

    const nextData = {
        ...(payload.fullName ? { fullName: String(payload.fullName) } : {}),
        ...(payload.email ? { email: String(payload.email) } : {}),
        ...(payload.role ? { role: payload.role as UserRole } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone ? String(payload.phone) : null } : {}),
        ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
        ...(payload.password ? { passwordHash: await hashPassword(String(payload.password)) } : {}),
        updatedAt: new Date(),
      }
    await usersCollection().updateOne({ _id: toObjectId(id) }, { $set: nextData })
    const user = await this.getById(id)

    await logActivity({
      entityType: 'USER',
      entityId: user.id,
      action: 'USER_UPDATED',
      message: 'User account updated',
      actorId: actor.id,
    })

    return user
  }

  async setActive(actor: Express.User, id: string, isActive: boolean) {
    return this.update(actor, id, { isActive })
  }
}

export const usersService = new UsersService()
