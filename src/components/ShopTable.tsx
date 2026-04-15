import { CalendarClock, FilePenLine, NotebookPen, Truck, View } from 'lucide-react'
import { formatDate } from '../utils/date'
import type { ShopRecord } from '../types/shop'
import { ReminderBadge } from './ReminderBadge'
import { StatusBadge } from './StatusBadge'

interface ShopTableProps {
  shops: ShopRecord[]
  onView: (shopId: string) => void
  onMarkDelivered: (shopId: string) => void
  onScheduleReminder: (shopId: string) => void
  onAddNote: (shopId: string) => void
  onStatus: (shopId: string) => void
}

export function ShopTable({
  shops,
  onView,
  onMarkDelivered,
  onScheduleReminder,
  onAddNote,
  onStatus,
}: ShopTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-[1180px] divide-y divide-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              {['Shop', 'Location', 'Delivery', 'Reminder', 'Status', 'Assigned', 'Actions'].map((item) => (
                <th key={item} className="px-5 py-4 font-semibold">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {shops.map((shop) => (
              <tr key={shop.id} className="align-top transition hover:bg-slate-50/70">
                <td className="px-5 py-5">
                  <button onClick={() => onView(shop.id)} className="space-y-1 text-left">
                    <p className="font-semibold text-slate-950">{shop.shopName}</p>
                    <p className="text-slate-500">{shop.ownerName}</p>
                    <p className="text-xs text-slate-400">{shop.phone1}</p>
                  </button>
                </td>
                <td className="px-5 py-5">
                  <p>{shop.area}</p>
                  <p className="mt-1 text-xs text-slate-400">{shop.city}</p>
                </td>
                <td className="px-5 py-5">
                  <p className="font-medium text-slate-900">{formatDate(shop.deliveryDate)}</p>
                  <p className="mt-1 text-xs text-slate-500">{shop.deliveryProductType}</p>
                </td>
                <td className="px-5 py-5">
                  <ReminderBadge date={shop.nextReminderDate} />
                </td>
                <td className="px-5 py-5">
                  <StatusBadge status={shop.status} />
                </td>
                <td className="px-5 py-5">
                  <p>{shop.assignedTo}</p>
                  <p className="mt-1 text-xs text-slate-400">{shop.priority} priority</p>
                </td>
                <td className="px-5 py-5">
                  <div className="grid grid-cols-3 gap-2">
                    <ActionButton icon={View} label="View" onClick={() => onView(shop.id)} />
                    <ActionButton icon={FilePenLine} label="Status" onClick={() => onStatus(shop.id)} />
                    <ActionButton icon={Truck} label="Delivered" onClick={() => onMarkDelivered(shop.id)} />
                    <ActionButton icon={CalendarClock} label="Reminder" onClick={() => onScheduleReminder(shop.id)} />
                    <ActionButton icon={NotebookPen} label="Note" onClick={() => onAddNote(shop.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof View
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
