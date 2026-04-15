import { MessageSquareText } from 'lucide-react'
import { formatDateTime } from '../utils/date'

export function NoteCard({
  body,
  author,
  createdAt,
}: {
  body: string
  author: string
  createdAt: string
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#eff6f4] p-3 text-[#1d6b57]">
          <MessageSquareText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{author}</p>
            <p className="text-xs text-slate-400">{formatDateTime(createdAt)}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  )
}
