import { Minus, PackageCheck, Plus, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FilterSelect } from '../components/FilterSelect'
import { Modal } from '../components/Modal'
import { ReminderBadge } from '../components/ReminderBadge'
import { SectionHeading } from '../components/SectionHeading'
import { deliveryCatalogRows, deliverySizeOptions, type DeliveryOrderLine } from '../constants/app'
import { useShops } from '../hooks/useShops'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../utils/date'
import { createEmptyDeliveryOrderLine, formatDeliveryLabel, formatDeliveryOrderSummary } from '../utils/delivery-orders'
import { getActiveReminder } from '../utils/reminders'

export function DeliveriesPage() {
  const { shops, addDelivery } = useShops()
  const { pushToast } = useToast()
  const [open, setOpen] = useState(false)
  const [shopId, setShopId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderLine[]>([
    createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
  ])
  const [price, setPrice] = useState('')
  const [billFileName, setBillFileName] = useState('')
  const [notes, setNotes] = useState('')

  const deliveries = useMemo(
    () =>
      shops
        .flatMap((shop) =>
          shop.deliveries.map((delivery) => ({
            ...delivery,
            shopName: shop.shopName,
            area: shop.area,
            assignedTo: shop.assignedTo,
            reminderDate:
              delivery.reminderDate ??
              getActiveReminder(
                shop.reminders.filter((reminder) => !reminder.deliveryId || reminder.deliveryId === delivery.id),
              )?.dueDate ??
              shop.nextReminderDate,
          })),
        )
        .sort((left, right) => +new Date(right.date) - +new Date(left.date)),
    [shops],
  )

  const selectedShop = shops.find((shop) => shop.id === shopId) ?? null

  function resetForm() {
    setShopId('')
    setDeliveryDate(new Date().toISOString().slice(0, 10))
    setDeliveryOrders([
      createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
    ])
    setPrice('')
    setBillFileName('')
    setNotes('')
  }

  function updateDeliveryOrder(index: number, patch: Partial<DeliveryOrderLine>) {
    setDeliveryOrders((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    )
  }

  function addOrderLine() {
    setDeliveryOrders((current) => [
      ...current,
      createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
    ])
  }

  function removeOrderLine(index: number) {
    setDeliveryOrders((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Delivery Tracking" title="Deliveries linked to future follow-ups" description="Track completed deliveries, and add new deliveries with price and optional bill details." />
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Month" value="April" onChange={() => undefined} options={['April', 'March', 'February']} />
          <FilterSelect label="Area" value="All areas" onChange={() => undefined} options={['All areas', 'South Kolkata', 'Salt Lake', 'Central Kolkata']} />
          <FilterSelect label="Staff" value="All staff" onChange={() => undefined} options={['All staff', 'Sales Executive', 'Field Officer', 'Area Supervisor']} />
          <button
            onClick={() => setOpen(true)}
            className="rounded-2xl bg-[#1d6b57] px-5 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Add delivery
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Monthly delivery summary" value={`${deliveries.length} deliveries`} detail="Across tracked business accounts" icon={PackageCheck} />
        <SummaryCard title="Recent delivered shops" value={`${shops.filter((shop) => shop.deliveries.length > 0).length} shops`} detail="Shops with delivery history" icon={Truck} />
        <SummaryCard title="Due-for-follow-up shops" value={`${shops.filter((shop) => shop.status === 'Follow-Up Required').length} shops`} detail="Need relationship action next" icon={PackageCheck} />
      </div>

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[980px] divide-y divide-slate-200">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  {['Shop Name', 'Product List', 'Price', 'Bill', 'Delivery Date', 'Delivery Status', 'Reminder Date', 'Assigned Staff', 'Notes'].map((header) => (
                    <th key={header} className="px-5 py-4 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="align-top">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{delivery.shopName}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDeliveryLabel(delivery.product)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.price != null ? `Rs. ${delivery.price}` : '-'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.billFileName || '-'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(delivery.date)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.status}</td>
                    <td className="px-5 py-4"><ReminderBadge date={delivery.reminderDate} /></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.assignedTo}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal open={open} title="Add delivery for an existing shop" onClose={() => { setOpen(false); resetForm() }}>
        <div className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Shop</span>
            <select
              value={shopId}
              onChange={(event) => {
                const nextShopId = event.target.value
                setShopId(nextShopId)
              }}
              className="input"
            >
              <option value="">Select a shop</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shopName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Delivery date</span>
            <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} className="input" />
          </label>

          <div className="space-y-3">
            <span className="text-sm font-medium text-slate-700">Order lines</span>
            {deliveryOrders.map((line, index) => (
              <div key={`${line.productType}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.6fr_1fr_auto]">
                <select value={line.productType} onChange={(event) => updateDeliveryOrder(index, { productType: event.target.value })} className="input">
                  {deliveryCatalogRows.map((row) => <option key={row.productName}>{row.productName}</option>)}
                </select>
                <select value={line.sizeLabel} onChange={(event) => updateDeliveryOrder(index, { sizeLabel: event.target.value })} className="input">
                  {deliverySizeOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <button
                  onClick={() => removeOrderLine(index)}
                  disabled={deliveryOrders.length === 1}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addOrderLine}
              className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              <Plus className="h-4 w-4" />
              Add another order
            </button>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Price</span>
            <input type="number" min="1" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="input" placeholder="4500" />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Bill upload (optional)</span>
            <input
              type="file"
              onChange={(event) => setBillFileName(event.target.files?.[0]?.name ?? '')}
              className="input py-2"
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="input" placeholder="Add delivery remarks or stock notes..." />
          </label>

          {selectedShop ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This delivery will be added to <span className="font-semibold text-slate-900">{selectedShop.shopName}</span> and will create a new follow-up reminder for that delivery.
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!shopId || !deliveryDate) {
                  pushToast('Missing details', 'Choose a shop and delivery date.')
                  return
                }

                try {
                  const deliverySummary = formatDeliveryOrderSummary(deliveryOrders)
                  if (!deliverySummary) {
                    pushToast('Missing details', 'Add at least one product order line.')
                    return
                  }

                  await addDelivery(shopId, {
                    deliveryDate,
                    productType: deliverySummary,
                    price: price ? Number(price) : undefined,
                    billFileName: billFileName || undefined,
                    notes: notes.trim() || undefined,
                  })
                  pushToast('Delivery added', 'The shop delivery history and delivery section were refreshed.')
                  setOpen(false)
                  resetForm()
                } catch (error) {
                  pushToast('Delivery failed', error instanceof Error ? error.message : 'The delivery could not be added.')
                }
              }}
              className="rounded-2xl bg-[#1d6b57] px-4 py-2 text-sm font-semibold text-white"
            >
              Save delivery
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SummaryCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: typeof PackageCheck }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(24,57,49,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div className="rounded-2xl bg-[#eff6f4] p-3 text-[#1d6b57]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
