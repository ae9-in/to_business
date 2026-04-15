import { CalendarRange, MapPin, Minus, Phone, Plus, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { NoteCard } from '../components/NoteCard'
import { ReminderBadge } from '../components/ReminderBadge'
import { SectionHeading } from '../components/SectionHeading'
import { StatusBadge } from '../components/StatusBadge'
import { TimelineCard } from '../components/TimelineCard'
import { deliveryCatalogRows, deliverySizeOptions, type DeliveryOrderLine } from '../constants/app'
import { useShops } from '../hooks/useShops'
import { useToast } from '../hooks/useToast'
import type { ShopFormValues } from '../types/shop'
import { formatDate } from '../utils/date'
import { createEmptyDeliveryOrderLine, formatDeliveryLabel, formatDeliveryOrderSummary } from '../utils/delivery-orders'
import { getActiveReminder } from '../utils/reminders'

type EditableShopValues = Pick<
  ShopFormValues,
  | 'shopName'
  | 'ownerName'
  | 'description'
  | 'phone1'
  | 'phone2'
  | 'email'
  | 'fullAddress'
  | 'area'
  | 'city'
  | 'pincode'
  | 'source'
>

function buildEditableValues(shop: NonNullable<ReturnType<typeof useShopSnapshot>>) {
  return {
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    description: shop.description,
    phone1: shop.phone1,
    phone2: shop.phone2 ?? '',
    email: shop.email,
    fullAddress: shop.fullAddress,
    area: shop.area,
    city: shop.city,
    pincode: shop.pincode,
    source: shop.source,
  }
}

function useShopSnapshot(shopId: string | undefined) {
  const { shops } = useShops()
  return useMemo(() => shops.find((candidate) => candidate.id === shopId), [shopId, shops])
}

export function ShopDetailsPage() {
  const { shopId } = useParams()
  const {
    shops,
    addDelivery,
    addNote,
    markDelivered,
    refreshShop,
    scheduleReminder,
    updateShop,
    updateStatus,
  } = useShops()
  const { pushToast } = useToast()
  const [newNote, setNewNote] = useState('')
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderLine[]>([
    createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
  ])
  const [deliveryPrice, setDeliveryPrice] = useState('')
  const [deliveryBillFileName, setDeliveryBillFileName] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const shop = useMemo(() => shops.find((candidate) => candidate.id === shopId), [shopId, shops])
  const activeReminder = useMemo(() => (shop ? getActiveReminder(shop.reminders) : null), [shop])
  const [editValues, setEditValues] = useState<EditableShopValues | null>(null)

  useEffect(() => {
    if (shopId) {
      void refreshShop(shopId)
    }
  }, [shopId, refreshShop])

  useEffect(() => {
    if (shop) {
      setEditValues(buildEditableValues(shop))
    }
  }, [shop])

  if (!shop) {
    return <EmptyState icon={UserRound} title="Shop not found" description="This business record could not be located. It may have been removed from local demo storage." />
  }

  const formattedAddress = [shop.fullAddress, shop.area, shop.city, shop.pincode].filter(Boolean).join(', ')

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
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#1d6b57]">Shop Profile</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{shop.shopName}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{shop.description}</p>
            </div>
            <StatusBadge status={shop.status} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProfileItem icon={UserRound} label="Owner / Contact" value={shop.ownerName} />
            <ProfileItem icon={Phone} label="Primary Phone" value={shop.phone1} />
            <ProfileItem icon={MapPin} label="Full Address" value={formattedAddress} />
            <ProfileItem icon={CalendarRange} label="Next Reminder" value={formatDate(activeReminder?.dueDate ?? shop.nextReminderDate)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => { void updateStatus(shop.id); pushToast('Status moved forward', 'Business stage updated successfully.') }} className="rounded-2xl bg-[#1d6b57] px-4 py-3 text-sm font-semibold text-white">
              Update status
            </button>
            <button
              onClick={() => setEditModalOpen(true)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Edit details
            </button>
            <button onClick={() => { void scheduleReminder(shop.id); pushToast('Reminder scheduled', 'New follow-up reminder added.') }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              Schedule reminder
            </button>
            <button
              onClick={() => {
                setDeliveryOrders([
                  createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
                ])
                setDeliveryPrice('')
                setDeliveryBillFileName('')
                setDeliveryNotes('')
                setDeliveryDate(new Date().toISOString().slice(0, 10))
                setDeliveryModalOpen(true)
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Add delivery
            </button>
            <button onClick={() => { void markDelivered(shop.id); pushToast('Delivery completed', 'Delivery history and reminder timeline were updated.') }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
              Quick delivered
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="Overview" description="Key commercial and follow-up context for this relationship." />
          <div className="mt-6 space-y-4">
            <OverviewRow label="Assigned Staff" value={shop.assignedTo} />
            <OverviewRow label="Priority" value={shop.priority} />
            <OverviewRow label="Source" value={shop.source} />
            <OverviewRow label="Email" value={shop.email || 'Not added'} />
            <OverviewRow label="Latest Delivery Product" value={formatDeliveryLabel(shop.deliveryProductType || 'Pooja Kit :: 1 Pack')} />
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reminder visibility</p>
              <div className="mt-3"><ReminderBadge date={activeReminder?.dueDate ?? shop.nextReminderDate} /></div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="Delivery History" description={`Real-time delivery history for ${shop.shopName} only.`} />
          <div className="mt-6 space-y-4">
            {shop.deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{delivery.product}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(delivery.date)} - {delivery.status}</p>
                  </div>
                  <ReminderBadge date={delivery.reminderDate ?? activeReminder?.dueDate ?? shop.nextReminderDate} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MiniMeta label="Product list" value={formatDeliveryLabel(delivery.product)} />
                  <MiniMeta label="Price" value={delivery.price != null ? `Rs. ${delivery.price}` : '-'} />
                  <MiniMeta label="Bill" value={delivery.billFileName || '-'} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{delivery.notes}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="Reminder Timeline" description="Scheduled revisits, completed follow-ups, and overdue signals." />
          <div className="mt-6 space-y-4">
            {shop.reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{reminder.type}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(reminder.dueDate)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{reminder.status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{reminder.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="Notes & Activity" description="Timestamped remarks and operational movement." />
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-medium text-slate-700">Add note</label>
            <textarea rows={4} value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Capture an internal remark or follow-up outcome..." className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
            <button onClick={() => { if (!newNote.trim()) return; void addNote(shop.id, newNote.trim()); pushToast('Note saved', 'Activity timeline refreshed with the new note.'); setNewNote('') }} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#1d6b57] px-4 py-2.5 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />
              Add note
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {shop.notes.map((note) => (
              <NoteCard key={note.id} body={note.body} author={note.author} createdAt={note.createdAt} />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
        <SectionHeading title="Activity Timeline" description="Recent operational history and relationship progress for this shop." />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {shop.activities.map((activity) => (
            <TimelineCard key={activity.id} title={activity.title} description={activity.description} createdAt={activity.createdAt} actor={activity.actor} />
          ))}
        </div>
      </section>

      <Modal open={deliveryModalOpen} title={`Add a new delivery for ${shop.shopName}`} onClose={() => setDeliveryModalOpen(false)}>
        <div className="space-y-4">
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
            <input type="number" min="1" step="0.01" value={deliveryPrice} onChange={(event) => setDeliveryPrice(event.target.value)} className="input" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Bill upload (optional)</span>
            <input
              type="file"
              onChange={(event) => setDeliveryBillFileName(event.target.files?.[0]?.name ?? '')}
              className="input py-2"
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Delivery notes</span>
            <textarea rows={4} value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} className="input" />
          </label>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeliveryModalOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!deliveryDate) {
                  pushToast('Missing details', 'Delivery date is required.')
                  return
                }

                try {
                  const deliverySummary = formatDeliveryOrderSummary(deliveryOrders)
                  if (!deliverySummary) {
                    pushToast('Missing details', 'Add at least one product order line.')
                    return
                  }

                  await addDelivery(shop.id, {
                    deliveryDate,
                    productType: deliverySummary,
                    price: deliveryPrice ? Number(deliveryPrice) : undefined,
                    billFileName: deliveryBillFileName || undefined,
                    notes: deliveryNotes.trim() || undefined,
                  })
                  pushToast('Delivery added', 'This shop delivery history was refreshed immediately.')
                  setDeliveryModalOpen(false)
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

      <Modal open={editModalOpen && editValues !== null} title={`Update details for ${shop.shopName}`} onClose={() => setEditModalOpen(false)}>
        {editValues ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Shop name" value={editValues.shopName} onChange={(value) => setEditValues((current) => current ? { ...current, shopName: value } : current)} />
              <Field label="Owner / Contact" value={editValues.ownerName} onChange={(value) => setEditValues((current) => current ? { ...current, ownerName: value } : current)} />
              <Field label="Primary phone" value={editValues.phone1} onChange={(value) => setEditValues((current) => current ? { ...current, phone1: value } : current)} />
              <Field label="Secondary phone" value={editValues.phone2} onChange={(value) => setEditValues((current) => current ? { ...current, phone2: value } : current)} />
              <Field label="Email" value={editValues.email} onChange={(value) => setEditValues((current) => current ? { ...current, email: value } : current)} />
              <Field label="Source" value={editValues.source} onChange={(value) => setEditValues((current) => current ? { ...current, source: value } : current)} />
              <div className="md:col-span-2">
                <Field label="Full address" value={editValues.fullAddress} onChange={(value) => setEditValues((current) => current ? { ...current, fullAddress: value } : current)} />
              </div>
              <Field label="Area" value={editValues.area} onChange={(value) => setEditValues((current) => current ? { ...current, area: value } : current)} />
              <Field label="City" value={editValues.city} onChange={(value) => setEditValues((current) => current ? { ...current, city: value } : current)} />
              <Field label="Pincode" value={editValues.pincode} onChange={(value) => setEditValues((current) => current ? { ...current, pincode: value } : current)} />
              <div className="md:col-span-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea rows={4} value={editValues.description} onChange={(event) => setEditValues((current) => current ? { ...current, description: event.target.value } : current)} className="input" />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditModalOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateShop(shop.id, editValues)
                    pushToast('Details updated', 'This shop view was refreshed with the latest details.')
                    setEditModalOpen(false)
                  } catch (error) {
                    pushToast('Update failed', error instanceof Error ? error.message : 'The shop details could not be updated.')
                  }
                }}
                className="rounded-2xl bg-[#1d6b57] px-4 py-2 text-sm font-semibold text-white"
              >
                Save changes
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="input" />
    </label>
  )
}

function ProfileItem({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#eff6f4] p-3 text-[#1d6b57]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}
