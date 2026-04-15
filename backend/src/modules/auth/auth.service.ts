import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { comparePassword, hashPassword } from '../../utils/password.js'
import { AppError } from '../../utils/app-error.js'
import { sha256 } from '../../utils/hash.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js'
import { logActivity } from '../../lib/activity-log.js'
import { env } from '../../config/env.js'
import { refreshTokensCollection, usersCollection } from '../../lib/mongo-helpers.js'
import { serializeMongo, toObjectId } from '../../lib/mongo.js'

function parseDurationToMs(value: string) {
  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const amount = Number(match[1])
  const unit = match[2]
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 86400000
  return amount * unitMs
}

export class AuthService {
  private async issueTokens(user: {
    id: string
    email: string
    role: string
    fullName?: string
    phone?: string | null
    isActive?: boolean
  }) {
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    })
    const refreshToken = signRefreshToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    })

    await refreshTokensCollection().insertOne({
      userId: toObjectId(user.id),
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN)),
      revokedAt: null,
      createdAt: new Date(),
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone ?? null,
        isActive: user.isActive ?? true,
      },
    }
  }

  async login(email: string, password: string) {
    const user = await usersCollection().findOne({ email })
    if (!user || !user.isActive) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials')
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials')
    }

    const serializedUser = serializeMongo(user) as unknown as {
      id: string
      email: string
      role: string
      fullName?: string
      phone?: string | null
      isActive?: boolean
    }
    const tokens = await this.issueTokens(serializedUser)
    await logActivity({
      entityType: 'AUTH',
      entityId: user.id,
      action: 'LOGIN',
      message: 'User logged in',
      actorId: user.id,
    })
    return tokens
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await refreshTokensCollection().updateMany(
        {
          userId: toObjectId(userId),
          tokenHash: sha256(refreshToken),
          revokedAt: null,
        },
        { $set: { revokedAt: new Date() } },
      )
    }

    await logActivity({
      entityType: 'AUTH',
      entityId: userId,
      action: 'LOGOUT',
      message: 'User logged out',
      actorId: userId,
    })
  }

  async me(userId: string) {
    const user = await usersCollection().findOne({ _id: toObjectId(userId) })

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found')
    }

    return serializeMongo(user)
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await usersCollection().findOne({ _id: toObjectId(userId) })
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found')

    const isValid = await comparePassword(currentPassword, user.passwordHash)
    if (!isValid) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Current password is incorrect')
    }

    await usersCollection().updateOne(
      { _id: toObjectId(userId) },
      { $set: { passwordHash: await hashPassword(newPassword), updatedAt: new Date() } },
    )

    await logActivity({
      entityType: 'AUTH',
      entityId: userId,
      action: 'PASSWORD_CHANGED',
      message: 'Password changed',
      actorId: userId,
    })
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    const existing = await refreshTokensCollection().findOne({
      userId: toObjectId(payload.sub),
      tokenHash: sha256(refreshToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })

    const user = existing
      ? await usersCollection().findOne({ _id: toObjectId(payload.sub) })
      : null

    if (!existing || !user || !user.isActive) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token')
    }

    await refreshTokensCollection().updateOne(
      { _id: existing._id as ObjectId },
      { $set: { revokedAt: new Date() } },
    )

    return this.issueTokens(
      serializeMongo(user) as unknown as {
        id: string
        email: string
        role: string
        fullName?: string
        phone?: string | null
        isActive?: boolean
      },
    )
  }
}

export const authService = new AuthService()
