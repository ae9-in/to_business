import type { ShopRecord, ShopStatus } from './shop'

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiListResponse<T> {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiUserSummary {
  id: string
  fullName: string
  email: string
  role?: string
}

export interface ApiReminder {
  id: string
  shopId: string
  deliveryId?: string | null
  reminderDate: string
  reminderType: string
  status: string
  priority: string
  title: string
  description?: string | null
  assignedStaffId?: string | null
  completedAt?: string | null
  snoozedUntil?: string | null
  createdBySystem: boolean
  createdAt: string
  updatedAt: string
  assignedStaff?: ApiUserSummary | null
}

export interface ApiDelivery {
  id: string
  shopId: string
  deliveryDate: string
  productType: string
  quantity?: number | null
  price?: number | null
  billFileName?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiNote {
  id: string
  shopId: string
  authorId: string
  content: string
  noteType: string
  createdAt: string
  updatedAt: string
  author?: ApiUserSummary
}

export interface ApiShop {
  id: string
  shopName: string
  ownerName: string
  businessType: string
  description?: string | null
  addressLine1: string
  addressLine2?: string | null
  area: string
  city: string
  state: string
  pincode: string
  phoneNumber1: string
  phoneNumber2?: string | null
  email?: string | null
  productCategory: string
  status: string
  priority: string
  source?: string | null
  assignedStaffId?: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  isArchived: boolean
  assignedStaff?: ApiUserSummary | null
  createdBy?: ApiUserSummary | null
  deliveries?: ApiDelivery[]
  reminders?: ApiReminder[]
  notes?: ApiNote[]
}

export interface DashboardSummary {
  totalShops: number
  activeShops: number
  inactiveShops: number
  newShopsThisMonth: number
  deliveriesThisMonth: number
  pendingReminders: number
  upcomingReminders: number
  overdueReminders: number
  remindersCompletedThisMonth: number
}

export interface DashboardStatusBreakdown {
  status: ShopStatus | string
  count: number
}

export interface DashboardMonthlyDeliveries {
  month: string
  count: number
}

export interface DashboardActivity {
  id: string
  entityType: string
  entityId: string
  action: string
  message: string
  actorId?: string | null
  createdAt: string
}

export interface ReportGroupCount {
  _count: Record<string, number>
  area?: string
  status?: string
  productCategory?: string
}

export interface ShopsReport {
  byArea: ReportGroupCount[]
  byStatus: ReportGroupCount[]
  byCategory: ReportGroupCount[]
}

export interface BackendConfig {
  apiBaseUrl: string
  authToken: string
}

export type LiveShopRecord = ShopRecord
