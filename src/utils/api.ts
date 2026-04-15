import type {
  ApiEnvelope,
  ApiListResponse,
  ApiShop,
  DashboardActivity,
  DashboardMonthlyDeliveries,
  DashboardStatusBreakdown,
  DashboardSummary,
} from '../types/api'
import { getApiBaseUrl, getAuthToken } from './backend-config'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export const api = {
  shops: () => request<ApiEnvelope<ApiListResponse<ApiShop>>>('/shops?limit=100'),
  shop: (shopId: string) => request<ApiEnvelope<ApiShop>>(`/shops/${shopId}`),
  createShop: (payload: unknown) =>
    request<ApiEnvelope<ApiShop>>('/shops', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateShop: (shopId: string, payload: unknown) =>
    request<ApiEnvelope<ApiShop>>(`/shops/${shopId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createDelivery: (payload: unknown) =>
    request<ApiEnvelope<unknown>>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateShopStatus: (shopId: string, status: string, note?: string) =>
    request<ApiEnvelope<ApiShop>>(`/shops/${shopId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  addNote: (shopId: string, content: string) =>
    request<ApiEnvelope<unknown>>(`/shops/${shopId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, noteType: 'FOLLOW_UP' }),
    }),
  createReminder: (payload: unknown) =>
    request<ApiEnvelope<unknown>>('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeReminder: (reminderId: string, completionNote?: string) =>
    request<ApiEnvelope<unknown>>(`/reminders/${reminderId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completionNote }),
    }),
  rescheduleReminder: (reminderId: string, reminderDate: string, reason?: string) =>
    request<ApiEnvelope<unknown>>(`/reminders/${reminderId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ reminderDate, reason }),
    }),
  snoozeReminder: (reminderId: string, snoozedUntil: string, reason?: string) =>
    request<ApiEnvelope<unknown>>(`/reminders/${reminderId}/snooze`, {
      method: 'PATCH',
      body: JSON.stringify({ snoozedUntil, reason }),
    }),
  dashboardSummary: () => request<ApiEnvelope<DashboardSummary>>('/dashboard/summary'),
  dashboardUpcoming: () => request<ApiEnvelope<ApiShop[]>>('/dashboard/upcoming-reminders'),
  dashboardOverdue: () => request<ApiEnvelope<ApiShop[]>>('/dashboard/overdue-reminders'),
  dashboardRecentShops: () => request<ApiEnvelope<ApiShop[]>>('/dashboard/recent-shops'),
  dashboardStatusBreakdown: () =>
    request<ApiEnvelope<DashboardStatusBreakdown[]>>('/dashboard/status-breakdown'),
  dashboardMonthlyDeliveries: () =>
    request<ApiEnvelope<DashboardMonthlyDeliveries[]>>('/dashboard/monthly-deliveries'),
  dashboardRecentActivity: async () => {
    const activity = await request<ApiEnvelope<DashboardActivity[]>>('/reports/followups')
    return activity
  },
  deliveries: () => request<ApiEnvelope<ApiListResponse<any>>>('/deliveries?limit=100'),
  reminders: () => request<ApiEnvelope<ApiListResponse<any>>>('/reminders?limit=100'),
  reportShops: () => request<ApiEnvelope<any>>('/reports/shops'),
  reportReminders: () => request<ApiEnvelope<any>>('/reports/reminders'),
}
