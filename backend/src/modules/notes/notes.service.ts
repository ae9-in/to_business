import { StatusCodes } from 'http-status-codes'
import { logActivity } from '../../lib/activity-log.js'
import { AppError } from '../../utils/app-error.js'
import {
  attachNoteRelations,
  notesCollection,
  shopsCollection,
} from '../../lib/mongo-helpers.js'
import { serializeMongo, toObjectId } from '../../lib/mongo.js'
import { NOTE_TYPES, type NoteType } from '../../types/models.js'
import { buildPaginationMeta, getPagination } from '../../utils/pagination.js'

const GENERAL_NOTE: NoteType = NOTE_TYPES[0]

export class NotesService {
  async list(query: Record<string, unknown>, actor?: Express.User) {
    const { page, limit, skip } = getPagination({
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    })
    const where = {
      ...(query.shopId ? { shopId: toObjectId(String(query.shopId)) } : {}),
    }

    const items = await notesCollection().find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    const hydrated = await Promise.all(items.map((item) => attachNoteRelations(item)))
    const filtered = actor?.role === 'STAFF'
      ? hydrated.filter((item) => item?.shop?.assignedStaffId === actor.id)
      : hydrated
    const total = filtered.length

    return { items: filtered, meta: buildPaginationMeta(total, page, limit) }
  }

  async create(actor: Express.User, payload: Record<string, unknown>) {
    const shopId = String(payload.shopId)
    const shop = serializeMongo(
      await shopsCollection().findOne({ _id: toObjectId(shopId), isArchived: false }),
    )
    if (!shop) throw new AppError(StatusCodes.NOT_FOUND, 'Shop not found')
    if (actor.role === 'STAFF' && shop.assignedStaffId !== actor.id) {
      throw new AppError(StatusCodes.FORBIDDEN, 'Staff can only add notes to assigned shops')
    }

    const created = await notesCollection().insertOne({
        shopId: toObjectId(shopId),
        authorId: toObjectId(actor.id),
        content: String(payload.content),
        noteType: (payload.noteType as NoteType | undefined) ?? GENERAL_NOTE,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
    const note = await attachNoteRelations(
      await notesCollection().findOne({ _id: created.insertedId }),
    )

    await logActivity({
      entityType: 'NOTE',
      entityId: note.id,
      action: 'NOTE_CREATED',
      message: 'Internal note created',
      actorId: actor.id,
      metadata: { shopId },
    })

    return note
  }

  async update(actor: Express.User, id: string, payload: Record<string, unknown>) {
    const existing = await attachNoteRelations(
      await notesCollection().findOne({ _id: toObjectId(id) }),
    )
    if (!existing) throw new AppError(StatusCodes.NOT_FOUND, 'Note not found')
    if (actor.role === 'STAFF' && existing.shop.assignedStaffId !== actor.id) {
      throw new AppError(StatusCodes.FORBIDDEN, 'Staff can only update notes on assigned shops')
    }

    await notesCollection().updateOne(
      { _id: toObjectId(id) },
      { $set: {
        ...(payload.content ? { content: String(payload.content) } : {}),
        ...(payload.noteType ? { noteType: payload.noteType as NoteType } : {}),
        updatedAt: new Date(),
      } },
    )
    const note = await attachNoteRelations(
      await notesCollection().findOne({ _id: toObjectId(id) }),
    )

    await logActivity({
      entityType: 'NOTE',
      entityId: note.id,
      action: 'NOTE_UPDATED',
      message: 'Internal note updated',
      actorId: actor.id,
    })
    return note
  }

  async remove(actor: Express.User, id: string) {
    const existing = await attachNoteRelations(
      await notesCollection().findOne({ _id: toObjectId(id) }),
    )
    if (!existing) throw new AppError(StatusCodes.NOT_FOUND, 'Note not found')
    if (actor.role === 'STAFF' && existing.shop.assignedStaffId !== actor.id) {
      throw new AppError(StatusCodes.FORBIDDEN, 'Staff can only delete notes on assigned shops')
    }

    await notesCollection().deleteOne({ _id: toObjectId(id) })
    await logActivity({
      entityType: 'NOTE',
      entityId: id,
      action: 'NOTE_DELETED',
      message: 'Internal note deleted',
      actorId: actor.id,
    })
  }
}

export const notesService = new NotesService()
