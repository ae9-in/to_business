import { MapPin, Phone } from 'lucide-react'
import type { ShopRecord } from '../types/shop'
import { formatDate } from '../utils/date'
import { ReminderBadge } from './ReminderBadge'
import { StatusBadge } from './StatusBadge'

export function ShopCard({
  shop,
  onOpen,
  onStatus,
}: {
  shop: ShopRecord
  onOpen: () => void
  onStatus: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">{shop.shopName}</p>
          <p className="mt-1 text-sm text-slate-500">{shop.ownerName}</p>
        </div>
        <StatusBadge status={shop.status} />
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          {shop.area}, {shop.city}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          {shop.phone1}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ReminderBadge date={shop.nextReminderDate} />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Delivery {formatDate(shop.deliveryDate, { day: '2-digit', month: 'short' })}
        </span>
      </div>
      <div className="mt-5 flex gap-3">
        <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          View
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onStatus()
          }}
          className="rounded-2xl bg-[#eff6f4] px-4 py-2 text-sm font-medium text-[#1d6b57]"
        >
          Progress status
        </button>
      </div>
    </button>
  )
}
