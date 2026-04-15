import clsx from 'clsx'
import { BellRing } from 'lucide-react'
import { formatDate } from '../utils/date'
import { getReminderUrgency } from '../utils/reminders'

export function ReminderBadge({ date }: { date: string }) {
  const urgency = getReminderUrgency(date)

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
        urgency === 'overdue' && 'bg-rose-100 text-rose-700 ring-rose-200',
        urgency === 'soon' && 'bg-amber-100 text-amber-800 ring-amber-200',
        urgency === 'upcoming' && 'bg-emerald-100 text-emerald-700 ring-emerald-200',
      )}
    >
      <BellRing className="h-3.5 w-3.5" />
      {formatDate(date, { day: '2-digit', month: 'short' })}
    </div>
  )
}
