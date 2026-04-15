import {
  AlertTriangle,
  BellRing,
  Building2,
  CircleCheckBig,
  PackageCheck,
  Store,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCallback, useMemo, useState } from 'react'
import { SectionHeading } from '../components/SectionHeading'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import { useShops } from '../hooks/useShops'
import type { DashboardMonthlyDeliveries, DashboardSummary } from '../types/api'
import { api } from '../utils/api'
import { formatDate } from '../utils/date'
import { getActiveReminder, getReminderUrgency } from '../utils/reminders'

const statusColors = ['#1d6b57', '#4f8f7c', '#8bb9ac', '#c8ddd6']
const reminderColors = ['#dc2626', '#d97706', '#1d6b57', '#2563eb']

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return month

  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
}

function buildFallbackDeliveryTrend(shops: ReturnType<typeof useShops>['shops']) {
  const grouped = shops
    .flatMap((shop) => shop.deliveries)
    .reduce<Record<string, number>>((acc, delivery) => {
      const date = new Date(delivery.date)
      if (Number.isNaN(date.getTime())) return acc

      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

  return Object.entries(grouped)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-5)
    .map(([month, deliveries]) => ({
      month: formatMonthLabel(month),
      deliveries,
    }))
}

function buildLiveDeliveryTrend(monthlyDeliveries: DashboardMonthlyDeliveries[]) {
  return [...monthlyDeliveries]
    .sort((left, right) => left.month.localeCompare(right.month))
    .slice(-5)
    .map((entry) => ({
      month: formatMonthLabel(entry.month),
      deliveries: entry.count,
    }))
}

function buildFallbackReminderBreakdown(
  overdueFollowUps: number,
  revisitSoon: number,
  upcomingReminders: number,
) {
  return [
    { name: 'Overdue', value: overdueFollowUps },
    { name: 'Due Soon', value: revisitSoon },
    { name: 'Upcoming', value: Math.max(upcomingReminders - revisitSoon, 0) },
  ].filter((entry) => entry.value > 0)
}

function buildLiveReminderBreakdown(summary: DashboardSummary) {
  return [
    { name: 'Overdue', value: summary.overdueReminders },
    { name: 'Pending', value: summary.pendingReminders },
    { name: 'Upcoming', value: summary.upcomingReminders },
    { name: 'Completed', value: summary.remindersCompletedThisMonth },
  ].filter((entry) => entry.value > 0)
}

function getDeliveryChangeLabel(trend: { deliveries: number }[]) {
  if (trend.length < 2) return 'Live'

  const previous = trend[trend.length - 2].deliveries
  const current = trend[trend.length - 1].deliveries
  if (previous === 0) return current > 0 ? '+100%' : '0%'

  const change = Math.round(((current - previous) / previous) * 100)
  return `${change >= 0 ? '+' : ''}${change}%`
}

export function DashboardPage() {
  const { shops } = useShops()
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [monthlyDeliveries, setMonthlyDeliveries] = useState<DashboardMonthlyDeliveries[]>([])
  const currentMonthKey = new Date().toISOString().slice(0, 7)

  const fallbackActiveShops = shops.filter((shop) => shop.status !== 'Inactive').length
  const fallbackPendingFollowUps = shops.filter(
    (shop) =>
      shop.status === 'Follow-Up Required' || shop.status === 'Revisit Needed',
  ).length
  const fallbackDeliveriesThisMonth = shops.filter((shop) =>
    shop.deliveries.some((delivery) => delivery.date.startsWith(currentMonthKey)),
  ).reduce((count, shop) => {
    return count + shop.deliveries.filter((delivery) => delivery.date.startsWith(currentMonthKey)).length
  }, 0)
  const fallbackUpcomingReminders = shops.filter(
    (shop) => {
      const reminder = getActiveReminder(shop.reminders)
      return reminder ? getReminderUrgency(reminder.dueDate) !== 'overdue' : false
    },
  ).length
  const fallbackOverdueFollowUps = shops.filter(
    (shop) => {
      const reminder = getActiveReminder(shop.reminders)
      return reminder ? getReminderUrgency(reminder.dueDate) === 'overdue' : false
    },
  ).length

  const recentShops = [...shops]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 4)
  const reminderFocus = [...shops]
    .filter((shop) => {
      const reminder = getActiveReminder(shop.reminders)
      return reminder ? getReminderUrgency(reminder.dueDate) !== 'upcoming' : false
    })
    .slice(0, 5)
  const revisitSoon = shops.filter(
    (shop) => {
      const reminder = getActiveReminder(shop.reminders)
      return reminder ? getReminderUrgency(reminder.dueDate) === 'soon' : false
    },
  )

  const refreshDashboard = useCallback(async () => {
    try {
      const [summaryResponse, monthlyDeliveriesResponse] = await Promise.all([
        api.dashboardSummary(),
        api.dashboardMonthlyDeliveries(),
      ])
      setDashboardSummary(summaryResponse.data)
      setMonthlyDeliveries(monthlyDeliveriesResponse.data)
    } catch {
      setDashboardSummary(null)
      setMonthlyDeliveries([])
    }
  }, [])

  usePolling(() => {
    void refreshDashboard()
  }, 10000)

  const activeShops = dashboardSummary?.activeShops ?? fallbackActiveShops
  const pendingFollowUps =
    dashboardSummary == null
      ? fallbackPendingFollowUps
      : dashboardSummary.pendingReminders + dashboardSummary.overdueReminders
  const deliveriesThisMonth =
    dashboardSummary?.deliveriesThisMonth ?? fallbackDeliveriesThisMonth
  const upcomingReminders =
    dashboardSummary?.upcomingReminders ?? fallbackUpcomingReminders
  const overdueFollowUps =
    dashboardSummary?.overdueReminders ?? fallbackOverdueFollowUps

  const statusDistribution = Object.values(
    shops.reduce<Record<string, { name: string; value: number }>>((acc, shop) => {
      acc[shop.status] = acc[shop.status] ?? { name: shop.status, value: 0 }
      acc[shop.status].value += 1
      return acc
    }, {}),
  )

  const deliveryTrend = useMemo(
    () =>
      monthlyDeliveries.length > 0
        ? buildLiveDeliveryTrend(monthlyDeliveries)
        : buildFallbackDeliveryTrend(shops),
    [monthlyDeliveries, shops],
  )

  const reminderBreakdown = useMemo(
    () =>
      dashboardSummary
        ? buildLiveReminderBreakdown(dashboardSummary)
        : buildFallbackReminderBreakdown(
            fallbackOverdueFollowUps,
            revisitSoon.length,
            fallbackUpcomingReminders,
          ),
    [dashboardSummary, fallbackOverdueFollowUps, fallbackUpcomingReminders, revisitSoon.length],
  )

  const deliveryChangeLabel = useMemo(
    () => getDeliveryChangeLabel(deliveryTrend),
    [deliveryTrend],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Shops" value={shops.length} detail="Tracked in the CRM" icon={Store} />
        <StatCard label="Active Shops" value={activeShops} detail="Current live relationships" icon={Building2} />
        <StatCard label="Pending Follow Ups" value={pendingFollowUps} detail="Require direct action" icon={BellRing} />
        <StatCard label="Deliveries This Month" value={deliveriesThisMonth} detail="Completed or in motion" icon={PackageCheck} />
        <StatCard label="Upcoming Reminders" value={upcomingReminders} detail="Visible in the next cycle" icon={CircleCheckBig} />
        <StatCard label="Overdue Follow Ups" value={overdueFollowUps} detail="Needs immediate recovery" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading
            eyebrow="Dashboard"
            title="Operational clarity at a glance"
            description="A quick scan of performance, upcoming reminders, and relationship health."
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 rounded-3xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Monthly deliveries overview</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eff6f4] px-3 py-1 text-xs font-medium text-[#1d6b57]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {deliveryChangeLabel}
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={240}>
                  <AreaChart data={deliveryTrend}>
                    <defs>
                      <linearGradient id="deliveryFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d6b57" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1d6b57" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="deliveries" stroke="#1d6b57" fill="url(#deliveryFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="min-w-0 rounded-3xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Reminder status breakdown</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={240}>
                  <PieChart>
                    <Pie data={reminderBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={4} dataKey="value">
                      {reminderBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={reminderColors[index % reminderColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading
            eyebrow="Activity"
            title="Priority reminder queue"
            description="Shops due today, overdue, or needing near-term revisits."
          />
          <div className="mt-6 space-y-3">
            {reminderFocus.map((shop) => (
              <div key={shop.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{shop.shopName}</p>
                    <p className="mt-1 text-sm text-slate-500">{shop.ownerName}</p>
                  </div>
                  <StatusBadge status={shop.status} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">Reminder due {formatDate(getActiveReminder(shop.reminders)?.dueDate ?? shop.nextReminderDate)}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    getReminderUrgency(getActiveReminder(shop.reminders)?.dueDate ?? shop.nextReminderDate) === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {getReminderUrgency(getActiveReminder(shop.reminders)?.dueDate ?? shop.nextReminderDate) === 'overdue' ? 'Overdue' : 'Due soon'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="Recent shops added" description="Latest businesses added into the pipeline." />
          <div className="mt-6 space-y-3">
            {recentShops.map((shop) => (
              <div key={shop.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{shop.shopName}</p>
                    <p className="text-sm text-slate-500">{shop.ownerName}</p>
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(shop.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm text-slate-600">{shop.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="30-day reminder watchlist" description="Businesses with reminders approaching from the 30-day delivery cycle." />
          <div className="mt-6 space-y-4">
            {revisitSoon.map((shop) => (
              <div key={shop.id} className="rounded-3xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{shop.shopName}</p>
                <p className="mt-1 text-sm text-slate-500">{shop.assignedTo} - {formatDate(getActiveReminder(shop.reminders)?.dueDate ?? shop.nextReminderDate)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
          <SectionHeading title="Status distribution" description="Relationship stages across the tracked shop base." />
          <div className="mt-6 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={240}>
              <BarChart data={statusDistribution}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="name" hide />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
