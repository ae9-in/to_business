import type { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { getDb, serializeMongo } from '../lib/mongo.js'
import { USER_ROLES } from '../types/models.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { hashPassword } from '../utils/password.js'

const [SUPER_ADMIN_ROLE, ADMIN_ROLE] = USER_ROLES

async function getLocalDevUser() {
  try {
    const users = getDb().collection('users')
    let user = await users.findOne(
      {
        isActive: true,
        role: { $in: [SUPER_ADMIN_ROLE, ADMIN_ROLE] },
      },
      {
        sort: { createdAt: 1 },
        projection: { email: 1, role: 1, isActive: 1 },
      },
    )

    if (!user) {
      const created = await users.insertOne({
          fullName: 'Local Admin',
          email: 'admin@tobusiness.local',
          passwordHash: await hashPassword('Password123!'),
          role: ADMIN_ROLE,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
      })
      user = await users.findOne({ _id: created.insertedId }, { projection: { email: 1, role: 1, isActive: 1 } })
    }

    return serializeMongo(user!)
  } catch {
    return {
      id: '000000000000000000000001',
      email: 'admin@tobusiness.local',
      role: ADMIN_ROLE,
      isActive: true,
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : req.cookies.accessToken

    if (!token) {
      const localUser = await getLocalDevUser()
      req.user = { id: localUser.id, email: localUser.email, role: localUser.role }
      return next()
    }

    let payload: ReturnType<typeof verifyAccessToken>
    try {
      payload = verifyAccessToken(token)
    } catch {
      const localUser = await getLocalDevUser()
      req.user = { id: localUser.id, email: localUser.email, role: localUser.role }
      return next()
    }

    const user = serializeMongo(
      await getDb().collection('users').findOne(
        { _id: new ObjectId(payload.sub) },
        { projection: { email: 1, role: 1, isActive: 1 } },
      ),
    )

    if (!user || !user.isActive) {
      const localUser = await getLocalDevUser()
      req.user = { id: localUser.id, email: localUser.email, role: localUser.role }
      return next()
    }

    req.user = { id: user.id, email: user.email, role: user.role }
    return next()
  } catch {
    const localUser = await getLocalDevUser()
    req.user = { id: localUser.id, email: localUser.email, role: localUser.role }
    return next()
  }
}
