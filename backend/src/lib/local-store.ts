import fs from 'node:fs'
import path from 'node:path'
import { ObjectId } from 'mongodb'
import { hashPassword } from '../utils/password.js'

type CollectionName =
  | 'users'
  | 'shops'
  | 'deliveries'
  | 'reminders'
  | 'notes'
  | 'activityLogs'
  | 'refreshTokens'
  | 'staffAssignmentHistory'

type LocalDatabase = Record<CollectionName, any[]>

const dataDir = process.env.VERCEL
  ? path.resolve('/tmp/to-business-data')
  : path.resolve(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'local-db.json')

let state: LocalDatabase | null = null

function blankDb(): LocalDatabase {
  return {
    users: [],
    shops: [],
    deliveries: [],
    reminders: [],
    notes: [],
    activityLogs: [],
    refreshTokens: [],
    staffAssignmentHistory: [],
  }
}

function isIsoDateString(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
}

function revive(value: any): any {
  if (Array.isArray(value)) return value.map(revive)
  if (!value || typeof value !== 'object') {
    if (isIsoDateString(value)) return new Date(value)
    return value
  }

  if (value && value.$oid) {
    return new ObjectId(value.$oid)
  }

  const output: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    output[key] = revive(entry)
  }
  return output
}

function serialize(value: any): any {
  if (value instanceof ObjectId) return { $oid: value.toHexString() }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      output[key] = serialize(entry)
    }
    return output
  }
  return value
}

function cloneValue<T>(value: T): T {
  return revive(serialize(value)) as T
}

async function seedIfNeeded(database: LocalDatabase) {
  if (database.users.length > 0) return

  const now = new Date()
  const adminId = new ObjectId()
  const staffId = new ObjectId()

  database.users.push(
    {
      _id: adminId,
      fullName: 'Admin',
      email: 'admin@tobusiness.local',
      passwordHash: await hashPassword('Password123!'),
      role: 'ADMIN',
      phone: '+919999999999',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: staffId,
      fullName: 'Field Staff',
      email: 'staff@tobusiness.local',
      passwordHash: await hashPassword('Password123!'),
      role: 'STAFF',
      phone: '+918888888888',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  )
}

async function ensureLoaded() {
  if (state) return state
  fs.mkdirSync(dataDir, { recursive: true })
  if (fs.existsSync(dbFile)) {
    const raw = JSON.parse(fs.readFileSync(dbFile, 'utf8'))
    state = revive(raw)
  } else {
    state = blankDb()
  }
  await seedIfNeeded(state as LocalDatabase)
  await persist()
  return state as LocalDatabase
}

async function persist() {
  if (!state) return
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(dbFile, JSON.stringify(serialize(state), null, 2))
}

function getByPath(source: any, dotted: string) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

function valuesEqual(left: any, right: any) {
  if (left instanceof ObjectId && right instanceof ObjectId) return left.equals(right)
  if (left instanceof ObjectId && typeof right === 'string') return left.toHexString() === right
  if (right instanceof ObjectId && typeof left === 'string') return right.toHexString() === left
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime()
  return left === right
}

function matchQuery(doc: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true
  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or') {
      return Array.isArray(condition) && condition.some((entry) => matchQuery(doc, entry))
    }
    const value = getByPath(doc, key)
    if (condition && typeof condition === 'object' && !(condition instanceof Date) && !(condition instanceof ObjectId) && !(condition instanceof RegExp)) {
      const ops = condition as Record<string, unknown>
      if ('$in' in ops) {
        return Array.isArray(ops.$in) && ops.$in.some((entry: any) => valuesEqual(value, entry))
      }
      if ('$gte' in ops && !(value >= (ops.$gte as any))) return false
      if ('$lte' in ops && !(value <= (ops.$lte as any))) return false
      if ('$gt' in ops && !(value > (ops.$gt as any))) return false
      if ('$regex' in ops) {
        const regex = ops.$regex instanceof RegExp
          ? ops.$regex
          : new RegExp(String(ops.$regex), String(ops.$options ?? ''))
        return regex.test(String(value ?? ''))
      }
    }
    if (condition instanceof RegExp) return condition.test(String(value ?? ''))
    return valuesEqual(value, condition)
  })
}

function applyProjection(doc: any, projection?: Record<string, number>) {
  if (!projection) return doc
  const keys = Object.entries(projection).filter(([, include]) => include).map(([key]) => key)
  const output: Record<string, unknown> = {}
  for (const key of keys) output[key] = doc[key]
  if (!('_id' in output) && projection._id !== 0 && doc._id) output._id = doc._id
  return output
}

class LocalCursor {
  private docs: any[]

  constructor(docs: any[]) {
    this.docs = [...docs]
  }

  sort(sort: Record<string, 1 | -1>) {
    const [[field, order]] = Object.entries(sort)
    this.docs.sort((a, b) => {
      const left = getByPath(a, field)
      const right = getByPath(b, field)
      if (left == null && right == null) return 0
      if (left == null) return 1
      if (right == null) return -1
      if (left > right) return order
      if (left < right) return -order
      return 0
    })
    return this
  }

  skip(count: number) {
    this.docs = this.docs.slice(count)
    return this
  }

  limit(count: number) {
    this.docs = this.docs.slice(0, count)
    return this
  }

  async toArray() {
    return this.docs.map((doc) => cloneValue(doc))
  }
}

class LocalCollection {
  constructor(private readonly name: CollectionName) {}

  private async docs() {
    const db = await ensureLoaded()
    return db[this.name]
  }

  find(query: any = {}) {
    const self = this
    return {
      sort(sort: Record<string, 1 | -1>) {
        return new LocalCursor((state?.[self.name] ?? []).filter((doc) => matchQuery(doc, query))).sort(sort)
      },
      skip(count: number) {
        return new LocalCursor((state?.[self.name] ?? []).filter((doc) => matchQuery(doc, query))).skip(count)
      },
      limit(count: number) {
        return new LocalCursor((state?.[self.name] ?? []).filter((doc) => matchQuery(doc, query))).limit(count)
      },
      async toArray() {
        const docs = await self.docs()
        return docs.filter((doc) => matchQuery(doc, query)).map((doc) => cloneValue(doc))
      },
    }
  }

  async findOne(query: any = {}, options?: { sort?: Record<string, 1 | -1>; projection?: Record<string, number> }) {
    let docs = (await this.docs()).filter((doc) => matchQuery(doc, query))
    if (options?.sort) {
      docs = await new LocalCursor(docs).sort(options.sort).toArray()
    }
    const doc = docs[0]
    return doc ? cloneValue(applyProjection(doc, options?.projection)) : null
  }

  async insertOne(document: any) {
    const docs = await this.docs()
    const next = { ...document, _id: document._id ?? new ObjectId() }
    docs.push(next)
    await persist()
    return { insertedId: next._id }
  }

  async updateOne(query: any, update: any) {
    const docs = await this.docs()
    const doc = docs.find((entry) => matchQuery(entry, query))
    if (!doc) return { matchedCount: 0, modifiedCount: 0 }
    if (update.$set) Object.assign(doc, update.$set)
    await persist()
    return { matchedCount: 1, modifiedCount: 1 }
  }

  async updateMany(query: any, update: any) {
    const docs = await this.docs()
    let count = 0
    for (const doc of docs) {
      if (!matchQuery(doc, query)) continue
      if (update.$set) Object.assign(doc, update.$set)
      count += 1
    }
    await persist()
    return { matchedCount: count, modifiedCount: count }
  }

  async deleteOne(query: any) {
    const docs = await this.docs()
    const index = docs.findIndex((entry) => matchQuery(entry, query))
    if (index === -1) return { deletedCount: 0 }
    docs.splice(index, 1)
    await persist()
    return { deletedCount: 1 }
  }

  async countDocuments(query: any = {}) {
    return (await this.docs()).filter((doc) => matchQuery(doc, query)).length
  }
}

export async function initLocalStore() {
  await ensureLoaded()
}

export function createLocalDb() {
  return {
    collection(name: string) {
      return new LocalCollection(name as CollectionName)
    },
    async command(command: { ping?: number }) {
      if (command.ping) return { ok: 1 }
      return { ok: 1 }
    },
  }
}
