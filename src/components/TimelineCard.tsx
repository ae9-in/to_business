import { formatDateTime } from '../utils/date'

export function TimelineCard({
  title,
  description,
  createdAt,
  actor,
}: {
  title: string
  description: string
  createdAt: string
  actor: string
}) {
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="absolute left-5 top-5 h-3 w-3 rounded-full bg-[#1d6b57]" />
      <div className="pl-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-400">{formatDateTime(createdAt)}</p>
        </div>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {actor}
        </p>
      </div>
    </div>
  )
}
