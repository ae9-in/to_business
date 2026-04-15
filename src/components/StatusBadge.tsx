import clsx from 'clsx'
import type { ShopStatus } from '../types/shop'

const statusStyles: Record<ShopStatus, string> = {
  'New Lead': 'bg-sky-100 text-sky-700 ring-sky-200',
  Contacted: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
  Interested: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  'Order Confirmed': 'bg-violet-100 text-violet-700 ring-violet-200',
  Delivered: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'Follow-Up Required': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Revisit Needed': 'bg-orange-100 text-orange-800 ring-orange-200',
  Inactive: 'bg-slate-200 text-slate-700 ring-slate-300',
}

export function StatusBadge({ status }: { status: ShopStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}
