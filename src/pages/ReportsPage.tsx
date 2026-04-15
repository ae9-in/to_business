import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCallback, useMemo, useState } from 'react'
import { SectionHeading } from '../components/SectionHeading'
import { usePolling } from '../hooks/usePolling'
import { useShops } from '../hooks/useShops'
import type { ShopsReport } from '../types/api'
import { api } from '../utils/api'

export function ReportsPage() {
  const { shops } = useShops()
  const [reportData, setReportData] = useState<ShopsReport | null>(null)

  const fallbackByArea = Object.entries(shops.reduce<Record<string, number>>((acc, shop) => { acc[shop.area] = (acc[shop.area] ?? 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value }))
  const fallbackByProduct = Object.entries(shops.reduce<Record<string, number>>((acc, shop) => { acc[shop.productCategory] = (acc[shop.productCategory] ?? 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value }))
  const fallbackActiveInactive = [
    { name: 'Active', value: shops.filter((shop) => shop.status !== 'Inactive').length },
    { name: 'Inactive', value: shops.filter((shop) => shop.status === 'Inactive').length },
  ]

  const refreshReports = useCallback(async () => {
    try {
      const response = await api.reportShops()
      setReportData(response.data)
    } catch {
      setReportData(null)
    }
  }, [])

  usePolling(() => {
    void refreshReports()
  }, 5000)

  const byArea = useMemo(
    () =>
      reportData?.byArea?.map((item) => ({
        name: item.area || 'Unknown',
        value: item._count.area ?? 0,
      })) ?? fallbackByArea,
    [fallbackByArea, reportData],
  )

  const byProduct = useMemo(
    () =>
      reportData?.byCategory?.map((item) => ({
        name: item.productCategory || 'Unknown',
        value: item._count.productCategory ?? 0,
      })) ?? fallbackByProduct,
    [fallbackByProduct, reportData],
  )

  const activeInactive = useMemo(() => {
    if (!reportData?.byStatus) return fallbackActiveInactive

    const active = reportData.byStatus
      .filter((item) => item.status !== 'INACTIVE')
      .reduce((sum, item) => sum + (item._count.status ?? 0), 0)
    const inactive = reportData.byStatus
      .filter((item) => item.status === 'INACTIVE')
      .reduce((sum, item) => sum + (item._count.status ?? 0), 0)

    return [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive },
    ]
  }, [fallbackActiveInactive, reportData])

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Reports" title="Business summary and performance view" description="Visual reporting on shop growth, deliveries, reminders completed, and account distribution. Charts refresh automatically from live backend data." />
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Shops by area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byArea}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#1d6b57" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Shops by product category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byProduct}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="name" hide />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f8f7c" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Active vs inactive shops">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={activeInactive} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={88} fill="#1d6b57" paddingAngle={4} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_rgba(24,57,49,0.08)]">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-6 h-80">{children}</div>
    </section>
  )
}
