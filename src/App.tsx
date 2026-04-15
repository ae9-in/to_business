import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastViewport } from './components/ToastViewport'
import { AppLayout } from './layouts/AppLayout'
import { AddShopPage } from './pages/AddShopPage'
import { DashboardPage } from './pages/DashboardPage'
import { DeliveriesPage } from './pages/DeliveriesPage'
import { RemindersPage } from './pages/RemindersPage'
import { ReportsPage } from './pages/ReportsPage'
import { ShopDetailsPage } from './pages/ShopDetailsPage'
import { ShopsPage } from './pages/ShopsPage'

function App() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/shops/new" element={<AddShopPage />} />
          <Route path="/shops/:shopId" element={<ShopDetailsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastViewport />
    </>
  )
}

export default App
