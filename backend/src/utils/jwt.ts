import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface JwtPayload {
  sub: string
  role: string
  email: string
  type: 'access' | 'refresh'
}

export function signAccessToken(payload: Omit<JwtPayload, 'type'>) {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] }
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    ...options,
  })
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>) {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    ...options,
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
}
