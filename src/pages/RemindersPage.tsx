import { CheckCircle2 } from 'lucide-react'
import { SectionHeading } from '../components/SectionHeading'
import { useShops } from '../hooks/useShops'
import { useToast } from '../hooks/useToast'
import type { ShopRecord } from '../types/shop'
import { formatDate } from '../utils/date'
import { getActiveReminder, getReminderUrgency } from '../utils/reminders'

function getCompletedReminder(shop: ShopRecord) {
  return [...shop.reminders]
    .filter((reminder) => reminder.status === 'Done')
    .sort((left, right) => +new Date(right.dueDate) - +new Date(left.dueDate))[0] ?? null
}

function getDisplayReminder(shop: ShopRecord) {
  return getActiveReminder(shop.reminders) ?? getCompletedReminder(shop) ?? shop.reminders[0] ?? null
}

export function RemindersPage() {
  const { shops, completeReminder } = useShops()
  const { pushToast } = useToast()

  const today = shops.filter((shop) => {
    const reminder = getActiveReminder(shop.reminders)
    return reminder ? getReminderUrgency(reminder.dueDate) === 'soon' : false
  })
  const overdue = shops.filter((shop) => {
    const reminder = getActiveReminder(shop.reminders)
    return reminder ? getReminderUrgency(reminder.dueDate) === 'overdue' : false
  })
  const upcoming = shops.filter((shop) => {
    const reminder = getActiveReminder(shop.reminders)
    return reminder ? getReminderUrgency(reminder.dueDate) === 'upcoming' : false
  })

  const groups = [
    { title: 'Today', items: today, tone: 'emerald' },
    { title: 'Upcoming in 2-3 days', items: upcoming.slice(0, 3), tone: 'amber' },
    { title: 'Later', items: upcoming.slice(3), tone: 'slate' },
    { title: 'Overdue', items: overdue, tone: 'rose' },
    { title: 'Completed', items: shops.filter((shop) => shop.reminders.some((reminder) => reminder.status === 'Done')).slice(0, 4), tone: 'emerald' },
  ] as const

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Reminder Management" title="Upcoming and overdue tasks" description="Reminders are calculated 30 days from delivery dates and surfaced here for faster follow-up handling." />

      {groups.map((group) => (
        <section key={group.title} className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{group.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{group.items.length} reminder items in this bucket</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Reminder logic: delivery date + 30 days
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-[1120px] divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    {['Shop', 'Latest Delivery', 'Reminder Date', 'Reminder Type', 'Assigned Staff', 'Bucket', 'Actions'].map((header) => (
                      <th key={header} className="px-5 py-4 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((shop) => {
                    const displayReminder = getDisplayReminder(shop)

                    return (
                      <tr key={`${group.title}-${shop.id}`} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-900">{shop.shopName}</p>
                          <p className="mt-1 text-sm text-slate-500">{shop.ownerName} - {shop.phone1}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(shop.deliveryDate)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(displayReminder?.dueDate ?? shop.nextReminderDate)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{displayReminder?.type ?? shop.reminderType}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{displayReminder?.assignedTo ?? shop.assignedTo}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            group.tone === 'rose' ? 'bg-rose-100 text-rose-700' : group.tone === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {group.title}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionPill
                              icon={CheckCircle2}
                              label="Mark done"
                              onClick={async () => {
                                const reminder = getActiveReminder(shop.reminders)
                                if (!reminder) {
                                  pushToast('No reminder found', 'This shop does not have a reminder to complete.')
                                  return
                                }
                                await completeReminder(reminder.id, 'Completed from reminders page.')
                                pushToast('Reminder completed', 'The reminder was marked as done.')
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

    </div>
  )
}

function ActionPill({ icon: Icon, label, onClick }: { icon: typeof CheckCircle2; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
