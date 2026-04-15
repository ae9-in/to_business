import { useMemo, useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { SectionHeading } from '../components/SectionHeading'
import {
  deliveryCatalogRows,
  deliverySizeOptions,
  regionAreaOptions,
  regionOptions,
  type DeliveryOrderLine,
  staffMembers,
} from '../constants/app'
import { useShops } from '../hooks/useShops'
import { useToast } from '../hooks/useToast'
import { PRIORITIES, SHOP_STATUSES, type ShopFormValues } from '../types/shop'
import { createEmptyDeliveryOrderLine, formatDeliveryOrderSummary } from '../utils/delivery-orders'
import { generateNextReminderDate } from '../utils/reminders'

const DEFAULT_BUSINESS_TYPE = 'General Business'
const DEFAULT_PRODUCT_CATEGORY = 'General Product'
const initialValues: ShopFormValues = {
  shopName: '',
  ownerName: '',
  businessType: DEFAULT_BUSINESS_TYPE,
  productCategory: DEFAULT_PRODUCT_CATEGORY,
  description: '',
  phone1: '',
  phone2: '',
  email: '',
  fullAddress: '',
  area: '',
  city: '',
  pincode: '',
  deliveryDate: '2026-04-10',
  deliveryProductType: '',
  deliveryQuantity: '',
  deliveryPrice: '',
  deliveryBillFileName: '',
  deliveryNotes: '',
  nextReminderDate: '',
  reminderNotes: '',
  assignedTo: 'Sales Executive',
  status: 'New Lead',
  priority: 'Medium',
  source: 'Field Visit',
}

export function AddShopPage() {
  const navigate = useNavigate()
  const { addShop } = useShops()
  const { pushToast } = useToast()
  const [values, setValues] = useState<ShopFormValues>(initialValues)
  const [selectedRegion, setSelectedRegion] = useState<(typeof regionOptions)[number] | ''>('')
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderLine[]>([
    createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const suggestedReminder = useMemo(
    () => (values.deliveryDate ? generateNextReminderDate(values.deliveryDate).slice(0, 10) : ''),
    [values.deliveryDate],
  )
  const availableAreas = selectedRegion ? regionAreaOptions[selectedRegion] : []

  function setField<K extends keyof ShopFormValues>(key: K, value: ShopFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function updateDeliveryOrder(index: number, patch: Partial<DeliveryOrderLine>) {
    setDeliveryOrders((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    )
  }

  function addDeliveryOrder() {
    setDeliveryOrders((current) => [
      ...current,
      createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
    ])
  }

  function removeDeliveryOrder(index: number) {
    setDeliveryOrders((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)))
  }

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!values.shopName.trim()) nextErrors.shopName = 'Shop name is required.'
    if (!values.ownerName.trim()) nextErrors.ownerName = 'Contact person is required.'
    if (!/^\+?[0-9\s-]{10,15}$/.test(values.phone1.trim())) nextErrors.phone1 = 'Enter a valid primary phone number.'
    if (values.phone2 && !/^\+?[0-9\s-]{10,15}$/.test(values.phone2.trim())) nextErrors.phone2 = 'Enter a valid secondary phone number.'
    if (!values.email.includes('@')) nextErrors.email = 'Enter a valid email address.'
    if (!values.deliveryDate) nextErrors.deliveryDate = 'Delivery date is required.'
    if (!deliveryOrders.every((line) => line.productType && line.sizeLabel)) nextErrors.deliveryProductType = 'Complete every order line.'
    if (values.deliveryPrice && Number(values.deliveryPrice) <= 0) nextErrors.deliveryPrice = 'Price must be greater than 0.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Quick Add"
        title="Add a new business or shop"
        description="Capture profile, delivery, and reminder details in one clean flow. The next 30-day reminder is suggested automatically."
      />

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (!validate()) return
          const deliverySummary = formatDeliveryOrderSummary(deliveryOrders)
          void addShop({
            ...values,
            deliveryProductType: deliverySummary,
            deliveryQuantity: '',
            nextReminderDate: values.nextReminderDate || suggestedReminder,
          })
            .then(() => {
              pushToast('Shop saved', 'New shop added and live data refreshed.')
              navigate('/shops')
            })
            .catch(() => {
              pushToast('Save failed', 'Check backend auth token and API settings.')
            })
        }}
      >
        <FormSection index={0} title="Basic Information" description="Profile the business with the core contact details only.">
          <FormField label="Shop Name" error={errors.shopName}>
            <input value={values.shopName} onChange={(event) => setField('shopName', event.target.value)} className="input" />
          </FormField>
          <FormField label="Owner / Contact Person" error={errors.ownerName}>
            <input value={values.ownerName} onChange={(event) => setField('ownerName', event.target.value)} className="input" />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Description / Notes">
              <textarea rows={5} value={values.description} onChange={(event) => setField('description', event.target.value)} className="input" />
            </FormField>
          </div>
        </FormSection>

        <FormSection index={1} title="Contact Information" description="Primary and secondary contact details for faster follow-up.">
          <FormField label="Phone Number 1" error={errors.phone1}>
            <input value={values.phone1} onChange={(event) => setField('phone1', event.target.value)} className="input" />
          </FormField>
          <FormField label="Phone Number 2" error={errors.phone2}>
            <input value={values.phone2} onChange={(event) => setField('phone2', event.target.value)} className="input" />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Email" error={errors.email}>
              <input value={values.email} onChange={(event) => setField('email', event.target.value)} className="input" />
            </FormField>
          </div>
        </FormSection>

        <FormSection index={2} title="Address Information" description="Location data for delivery routing and area-level reporting.">
          <div className="md:col-span-2 lg:col-span-3">
            <FormField label="Full Address">
              <input value={values.fullAddress} onChange={(event) => setField('fullAddress', event.target.value)} className="input" />
            </FormField>
          </div>
          <FormField label="Region">
            <select
              value={selectedRegion}
              onChange={(event) => {
                const nextRegion = event.target.value as (typeof regionOptions)[number] | ''
                setSelectedRegion(nextRegion)
                setField('area', '')
              }}
              className="input"
            >
              <option value="">Select region</option>
              {regionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="Area">
            <select
              value={values.area}
              onChange={(event) => setField('area', event.target.value)}
              className="input"
              disabled={!selectedRegion}
            >
              <option value="">{selectedRegion ? 'Select area' : 'Select region first'}</option>
              {availableAreas.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="City">
            <input value={values.city} onChange={(event) => setField('city', event.target.value)} className="input" />
          </FormField>
          <FormField label="Pincode">
            <input value={values.pincode} onChange={(event) => setField('pincode', event.target.value)} className="input" />
          </FormField>
        </FormSection>

        <FormSection index={3} title="Delivery Information" description="Add one or more order lines, then enter the total delivery price with an optional bill upload.">
          <FormField label="Date of Delivery" error={errors.deliveryDate}>
            <input type="date" value={values.deliveryDate} onChange={(event) => setField('deliveryDate', event.target.value)} className="input" />
          </FormField>
          <div className="md:col-span-2 lg:col-span-3">
            <FormField label="Order lines" error={errors.deliveryProductType}>
              <div className="space-y-3">
                {deliveryOrders.map((line, index) => (
                  <div key={`${line.productType}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.6fr_1fr_auto]">
                    <select value={line.productType} onChange={(event) => updateDeliveryOrder(index, { productType: event.target.value })} className="input">
                      {deliveryCatalogRows.map((row) => <option key={row.productName}>{row.productName}</option>)}
                    </select>
                    <select value={line.sizeLabel} onChange={(event) => updateDeliveryOrder(index, { sizeLabel: event.target.value })} className="input">
                      {deliverySizeOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeDeliveryOrder(index)}
                      disabled={deliveryOrders.length === 1}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDeliveryOrder}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <Plus className="h-4 w-4" />
                  Add another order
                </button>
              </div>
            </FormField>
          </div>
          <FormField label="Price" error={errors.deliveryPrice}>
            <input type="number" min="1" step="0.01" value={values.deliveryPrice} onChange={(event) => setField('deliveryPrice', event.target.value)} className="input" />
          </FormField>
          <FormField label="Bill Upload (Optional)">
            <input
              type="file"
              onChange={(event) => setField('deliveryBillFileName', event.target.files?.[0]?.name ?? '')}
              className="input py-2"
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Delivery Notes">
              <textarea rows={4} value={values.deliveryNotes} onChange={(event) => setField('deliveryNotes', event.target.value)} className="input" />
            </FormField>
          </div>
        </FormSection>

        <FormSection index={4} title="Follow-up / Reminder" description="Reminder defaults to 30 days after delivery, with manual override supported.">
          <FormField label="Suggested Reminder">
            <input value={suggestedReminder} readOnly className="input bg-slate-50" />
          </FormField>
          <FormField label="Override Reminder Date">
            <input type="date" value={values.nextReminderDate} onChange={(event) => setField('nextReminderDate', event.target.value)} className="input" />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Reminder Notes">
              <textarea rows={4} value={values.reminderNotes} onChange={(event) => setField('reminderNotes', event.target.value)} className="input" />
            </FormField>
          </div>
          <FormField label="Assigned Staff Member">
            <select value={values.assignedTo} onChange={(event) => setField('assignedTo', event.target.value)} className="input">
              {staffMembers.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
        </FormSection>

        <FormSection index={5} title="Status Section" description="Initial business stage, priority, and lead source.">
          <FormField label="Initial Status">
            <select value={values.status} onChange={(event) => setField('status', event.target.value as ShopFormValues['status'])} className="input">
              {SHOP_STATUSES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="Priority">
            <select value={values.priority} onChange={(event) => setField('priority', event.target.value as ShopFormValues['priority'])} className="input">
              {PRIORITIES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </FormField>
          <FormField label="Source">
            <input value={values.source} onChange={(event) => setField('source', event.target.value)} className="input" />
          </FormField>
        </FormSection>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setValues(initialValues)
              setSelectedRegion('')
              setDeliveryOrders([
                createEmptyDeliveryOrderLine(deliveryCatalogRows[0]?.productName ?? 'Pooja Kit', deliverySizeOptions[0] ?? '1 Pack'),
              ])
              setErrors({})
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600"
          >
            Reset
          </button>
          <button type="submit" className="rounded-2xl bg-[#1d6b57] px-5 py-3 text-sm font-semibold text-white shadow-lg">
            Save shop
          </button>
        </div>
      </form>
    </div>
  )
}

function FormSection({ title, description, children, index }: { title: string; description: string; children: ReactNode; index: number }) {
  return (
    <section
      className="section-card section-reveal rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}
