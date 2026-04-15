import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(24,57,49,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div className="rounded-2xl bg-[#eff6f4] p-3 text-[#1d6b57]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
