import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { initialShops } from '../mock-data/shops'
import type { ShopFormValues, ShopRecord, ShopStatus } from '../types/shop'
import { api } from '../utils/api'
import { mapShop } from '../utils/mappers'
import { usePolling } from '../hooks/usePolling'

export interface ShopsContextValue {
  shops: ShopRecord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshShop: (shopId: string) => Promise<void>
  addShop: (values: ShopFormValues) => Promise<void>
  addDelivery: (
    shopId: string,
    values: {
      deliveryDate: string
      productType: string
      sizeLabel?: string
      quantity?: number
      price?: number
      billFileName?: string
      notes?: string
    },
  ) => Promise<void>
  updateShop: (shopId: string, values: Partial<ShopFormValues>) => Promise<void>
  updateStatus: (shopId: string, status?: ShopStatus) => Promise<void>
  addNote: (shopId: string, body: string) => Promise<void>
  markDelivered: (shopId: string) => Promise<void>
  scheduleReminder: (shopId: string, reminderDate?: string) => Promise<void>
  completeReminder: (reminderId: string, completionNote?: string) => Promise<void>
  rescheduleReminder: (reminderId: string, reminderDate: string, reason?: string) => Promise<void>
  snoozeReminder: (reminderId: string, snoozedUntil: string, reason?: string) => Promise<void>
}

export const ShopsContext = createContext<ShopsContextValue | undefined>(undefined)

function inferState(city: string, area: string) {
  const location = `${city} ${area}`.toLowerCase()
  return location.includes('hosur') ? 'Tamil Nadu' : 'Karnataka'
}

function toBackendStatus(status: ShopStatus) {
  const statusMap: Record<ShopStatus, string> = {
    'New Lead': 'NEW_LEAD',
    Contacted: 'CONTACTED',
    Interested: 'INTERESTED',
    'Order Confirmed': 'ORDER_CONFIRMED',
    Delivered: 'DELIVERED',
    'Follow-Up Required': 'FOLLOW_UP_REQUIRED',
    'Revisit Needed': 'REVISIT_NEEDED',
    Inactive: 'INACTIVE',
  }

  return statusMap[status]
}

function getNextStatus(status: ShopStatus): ShopStatus {
  const sequence: ShopStatus[] = [
    'New Lead',
    'Contacted',
    'Interested',
    'Order Confirmed',
    'Delivered',
    'Follow-Up Required',
    'Revisit Needed',
    'Inactive',
  ]
  const index = sequence.indexOf(status)
  return sequence[Math.min(index + 1, sequence.length - 1)]
}

export function ShopsProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<ShopRecord[]>(initialShops)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await api.shops()
      setShops(response.data.items.map(mapShop))
      setError(null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load shops')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshShop = useCallback(async (shopId: string) => {
    try {
      const response = await api.shop(shopId)
      const mapped = mapShop(response.data)
      setShops((current) => {
        const index = current.findIndex((shop) => shop.id === shopId)
        if (index === -1) return [mapped, ...current]
        const next = [...current]
        next[index] = mapped
        return next
      })
      setError(null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load shop')
    } finally {
      setLoading(false)
    }
  }, [])

  usePolling(() => {
    void refresh()
  }, 10000)

  const value = useMemo<ShopsContextValue>(
    () => ({
      shops,
      loading,
      error,
      refresh,
      refreshShop,
      async addShop(values) {
        const payload = {
          shopName: values.shopName,
          ownerName: values.ownerName,
          businessType: values.businessType,
          description: values.description,
          addressLine1: values.fullAddress,
          addressLine2: '',
          area: values.area,
          city: values.city,
          state: inferState(values.city, values.area),
          pincode: values.pincode,
          phoneNumber1: values.phone1,
          phoneNumber2: values.phone2,
          email: values.email,
          productCategory: values.productCategory,
          status: toBackendStatus(values.status),
          priority: values.priority.toUpperCase(),
          source: values.source,
        }
        const response = await api.createShop(payload)
        await api.createDelivery({
          shopId: response.data.id,
          deliveryDate: new Date(`${values.deliveryDate}T09:00:00`).toISOString(),
          productType: values.deliveryQuantity
            ? `${values.deliveryProductType} :: ${values.deliveryQuantity}`
            : values.deliveryProductType,
          quantity: undefined,
          price: values.deliveryPrice ? Number(values.deliveryPrice) : undefined,
          billFileName: values.deliveryBillFileName || undefined,
          notes: values.deliveryNotes || undefined,
        })
        await refresh()
      },
      async addDelivery(shopId, values) {
        await api.createDelivery({
          shopId,
          deliveryDate: new Date(`${values.deliveryDate}T09:00:00`).toISOString(),
          productType: values.sizeLabel ? `${values.productType} :: ${values.sizeLabel}` : values.productType,
          quantity: values.quantity,
          price: values.price,
          billFileName: values.billFileName,
          notes: values.notes || undefined,
        })
        await refreshShop(shopId)
      },
      async updateShop(shopId, values) {
        await api.updateShop(shopId, {
          ...(values.shopName !== undefined ? { shopName: values.shopName } : {}),
          ...(values.ownerName !== undefined ? { ownerName: values.ownerName } : {}),
          ...(values.businessType !== undefined ? { businessType: values.businessType } : {}),
          ...(values.description !== undefined ? { description: values.description } : {}),
          ...(values.fullAddress !== undefined ? { addressLine1: values.fullAddress } : {}),
          ...(values.area !== undefined ? { area: values.area } : {}),
          ...(values.city !== undefined ? { city: values.city } : {}),
          ...(values.pincode !== undefined ? { pincode: values.pincode } : {}),
          ...(values.phone1 !== undefined ? { phoneNumber1: values.phone1 } : {}),
          ...(values.phone2 !== undefined ? { phoneNumber2: values.phone2 } : {}),
          ...(values.email !== undefined ? { email: values.email } : {}),
          ...(values.productCategory !== undefined ? { productCategory: values.productCategory } : {}),
          ...(values.priority !== undefined ? { priority: values.priority.toUpperCase() } : {}),
          ...(values.source !== undefined ? { source: values.source } : {}),
          state: inferState(values.city ?? '', values.area ?? ''),
        })
        await refreshShop(shopId)
      },
      async updateStatus(shopId, status) {
        const currentStatus = shops.find((shop) => shop.id === shopId)?.status ?? 'New Lead'
        const target = status ?? getNextStatus(currentStatus)
        await api.updateShopStatus(shopId, toBackendStatus(target))
        await refreshShop(shopId)
      },
      async addNote(shopId, body) {
        await api.addNote(shopId, body)
        await refreshShop(shopId)
      },
      async markDelivered(shopId) {
        const shop = shops.find((entry) => entry.id === shopId)
        if (!shop) return
        await api.createDelivery({
          shopId,
          deliveryDate: new Date().toISOString(),
          productType: shop.deliveryProductType || shop.productCategory,
          quantity: undefined,
          price: undefined,
          billFileName: undefined,
          notes: 'Marked delivered from live dashboard action.',
        })
        await api.updateShopStatus(shopId, 'DELIVERED')
        await refreshShop(shopId)
      },
      async scheduleReminder(shopId, reminderDate) {
        const shop = shops.find((entry) => entry.id === shopId)
        if (!shop) return
        await api.createReminder({
          shopId,
          reminderDate: reminderDate ?? shop.nextReminderDate,
          reminderType: 'MANUAL_FOLLOWUP',
          title: `Follow-up for ${shop.shopName}`,
          description: 'Scheduled from tracking view',
        })
        await refreshShop(shopId)
      },
      async completeReminder(reminderId, completionNote) {
        await api.completeReminder(reminderId, completionNote)
        await refresh()
      },
      async rescheduleReminder(reminderId, reminderDate, reason) {
        await api.rescheduleReminder(reminderId, reminderDate, reason)
        await refresh()
      },
      async snoozeReminder(reminderId, snoozedUntil, reason) {
        await api.snoozeReminder(reminderId, snoozedUntil, reason)
        await refresh()
      },
    }),
    [shops, loading, error, refresh, refreshShop],
  )

  return <ShopsContext.Provider value={value}>{children}</ShopsContext.Provider>
}
