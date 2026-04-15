import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  Menu,
  PackagePlus,
  ReceiptText,
  Store,
  Truck,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { navItems } from '../constants/app'
import { formatDate } from '../utils/date'

const navIcons = {
  Dashboard: LayoutDashboard,
  Shops: Store,
  'Add Shop': PackagePlus,
  Deliveries: Truck,
  Reminders: ListChecks,
  Reports: ReceiptText,
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const pageTitle = useMemo(
    () => navItems.find((item) => item.path === location.pathname)?.label ?? 'Shop Details',
    [location.pathname],
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(29,107,87,0.14),_transparent_32%),linear-gradient(180deg,_#f4f8f6_0%,_#eef3f1_100%)]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/60 bg-slate-950 px-4 py-6 text-white shadow-2xl transition-all duration-300 lg:static ${
            collapsed ? 'w-[90px]' : 'w-[280px]'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="flex items-center justify-between">
            <div className={collapsed ? 'hidden' : 'block'}>
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">To Businesses</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Shop Tracking</h1>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl bg-white/10 p-2 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setCollapsed((value) => !value)}
            className="mt-6 hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 lg:block"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = navIcons[item.label]
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-[#1d6b57] text-white shadow-lg' : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={collapsed ? 'hidden' : 'inline'}>{item.label}</span>
                  <span className={`text-xs ${collapsed ? 'inline' : 'hidden'}`}>{item.shortLabel}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto rounded-3xl bg-white/6 p-4">
            <p className={`text-xs uppercase tracking-[0.18em] text-slate-400 ${collapsed ? 'hidden' : 'block'}`}>Ops Health</p>
            <p className="mt-2 text-sm text-slate-200">
              {collapsed ? '92%' : '92% reminders visible and ready for action'}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f4f8f6]/90 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-[180px]">
                <p className="text-xs uppercase tracking-[0.24em] text-[#1d6b57]">Internal operations</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{pageTitle}</h2>
              </div>
              <div className="min-w-[280px] flex-1">
                <SearchBar value="" onChange={() => undefined} placeholder="Global search across shops and reminders..." />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 md:block">
                  {formatDate(new Date().toISOString(), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <button className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-700">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                </button>
                <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1d6b57] font-semibold text-white">A</div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">Admin</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
