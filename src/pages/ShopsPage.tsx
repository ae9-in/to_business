import { ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '../components/Drawer'
import { EmptyState } from '../components/EmptyState'
import { FilterSelect } from '../components/FilterSelect'
import { Modal } from '../components/Modal'
import { SearchBar } from '../components/SearchBar'
import { SectionHeading } from '../components/SectionHeading'
import { ShopCard } from '../components/ShopCard'
import { ShopTable } from '../components/ShopTable'
import { staffMembers, statusOrder } from '../constants/app'
import { useShops } from '../hooks/useShops'
import { useToast } from '../hooks/useToast'
import { SHOP_STATUSES, type ShopRecord, type ShopStatus } from '../types/shop'

const pageSize = 4

export function ShopsPage() {
  const { shops, addNote, loading, error, markDelivered, scheduleReminder, updateStatus } = useShops()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [staff, setStaff] = useState('All staff')
  const [sort, setSort] = useState('Newest')
  const [page, setPage] = useState(1)
  const [noteShop, setNoteShop] = useState<ShopRecord | null>(null)
  const [noteText, setNoteText] = useState('')
  const [confirmShopId, setConfirmShopId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ShopStatus>('New Lead')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = shops
      .filter((shop) => {
        const haystack = [shop.shopName, shop.phone1, shop.area, shop.ownerName, shop.deliveryProductType].join(' ').toLowerCase()
        return normalized ? haystack.includes(normalized) : true
      })
      .filter((shop) => (status === 'All statuses' ? true : shop.status === status))
      .filter((shop) => (staff === 'All staff' ? true : shop.assignedTo === staff))

    return next.sort((left, right) => {
      switch (sort) {
        case 'Oldest':
          return +new Date(left.createdAt) - +new Date(right.createdAt)
        case 'Upcoming Reminder':
          return +new Date(left.nextReminderDate) - +new Date(right.nextReminderDate)
        case 'Recent Delivery':
          return +new Date(right.deliveryDate) - +new Date(left.deliveryDate)
        default:
          return +new Date(right.createdAt) - +new Date(left.createdAt)
      }
    })
  }, [query, shops, sort, staff, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Main Tracking View"
          title="Shops and relationship pipeline"
          description="Search, filter, sort, and take quick actions on shop accounts from one command center."
        />
        <button
          onClick={() => navigate('/shops/new')}
          className="rounded-2xl bg-[#1d6b57] px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          Add new shop
        </button>
      </div>

      <div className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
        <div className="grid gap-4 xl:grid-cols-[1.8fr_repeat(3,_minmax(160px,_1fr))]">
          <SearchBar value={query} onChange={setQuery} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={['All statuses', ...statusOrder]} />
          <FilterSelect label="Assigned staff" value={staff} onChange={setStaff} options={['All staff', ...staffMembers]} />
          <FilterSelect label="Sort by" value={sort} onChange={setSort} options={['Newest', 'Oldest', 'Upcoming Reminder', 'Recent Delivery']} />
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Live backend sync issue: {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
          Loading live shops...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title="No shops match these filters"
          description="Try widening the search or reset one of the filter controls to bring shops back into view."
        />
      ) : (
        <>
          <div className="hidden xl:block">
            <ShopTable
              shops={paged}
              onView={(shopId) => navigate(`/shops/${shopId}`)}
              onMarkDelivered={(shopId) => {
                void markDelivered(shopId)
                pushToast('Delivery marked', 'Live data is refreshing.')
              }}
              onScheduleReminder={(shopId) => {
                void scheduleReminder(shopId)
                pushToast('Reminder scheduled', 'Live data is refreshing.')
              }}
              onAddNote={(shopId) => setNoteShop(shops.find((shop) => shop.id === shopId) ?? null)}
              onStatus={(shopId) => {
                const selectedShop = shops.find((shop) => shop.id === shopId)
                setConfirmShopId(shopId)
                setSelectedStatus(selectedShop?.status ?? 'New Lead')
              }}
            />
          </div>

          <div className="grid gap-4 xl:hidden">
            {paged.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onOpen={() => navigate(`/shops/${shop.id}`)}
                onStatus={() => {
                  setConfirmShopId(shop.id)
                  setSelectedStatus(shop.status)
                }}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/70 px-5 py-4">
        <p className="text-sm text-slate-500">
          Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} shops
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
          >
            Previous
          </button>
          <span className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            {safePage}/{totalPages}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
          >
            Next
          </button>
        </div>
      </div>

      <Drawer
        open={noteShop !== null}
        title={noteShop ? `Add note for ${noteShop.shopName}` : 'Add note'}
        onClose={() => {
          setNoteShop(null)
          setNoteText('')
        }}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Capture follow-up outcomes, relationship updates, or internal context for the next visit.
          </p>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            rows={7}
            placeholder="Add a note about the shop, delivery feedback, or next action..."
            className="w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
          />
          <button
            onClick={() => {
              if (!noteShop || !noteText.trim()) return
              void addNote(noteShop.id, noteText.trim())
              pushToast('Note added', 'The shop activity timeline has been updated.')
              setNoteShop(null)
              setNoteText('')
            }}
            className="rounded-2xl bg-[#1d6b57] px-4 py-3 text-sm font-semibold text-white"
          >
            Save note
          </button>
        </div>
      </Drawer>

      <Modal
        open={confirmShopId !== null}
        title="Update shop status"
        onClose={() => setConfirmShopId(null)}
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-600">
            Choose the exact business stage you want for this shop.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SHOP_STATUSES.map((option) => {
              const isSelected = selectedStatus === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedStatus(option)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    isSelected
                      ? 'border-[#1d6b57] bg-[#eff6f4] text-[#1d6b57]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmShopId(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!confirmShopId) return
                try {
                  await updateStatus(confirmShopId, selectedStatus)
                  pushToast('Status updated', `The shop status was changed to ${selectedStatus}.`)
                  setConfirmShopId(null)
                } catch (error) {
                  pushToast(
                    'Status update failed',
                    error instanceof Error ? error.message : 'The shop status could not be updated.',
                  )
                }
              }}
              className="rounded-2xl bg-[#1d6b57] px-4 py-2 text-sm font-semibold text-white"
            >
              Update status
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
