import type { UserRole } from './models.js'

declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      role: UserRole
    }

    interface Request {
      user?: User
    }
  }
}

export {}
