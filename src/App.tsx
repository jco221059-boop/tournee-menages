import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { BottomNav } from './components/layout/BottomNav'
import { Spinner } from './components/ui'

// Pages
import LoginPage from './pages/LoginPage'
import TodayPage from './pages/TodayPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyFormPage from './pages/PropertyFormPage'
import ReservationsPage from './pages/ReservationsPage'
import ReservationFormPage from './pages/ReservationFormPage'
import OptimizePage from './pages/OptimizePage'
import PlanningPage from './pages/PlanningPage'
import FieldModePage from './pages/FieldModePage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'
import StatsPage from './pages/StatsPage'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={36} />
          <p className="text-text-secondary text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/today" replace />} />
        <Route path="/" element={<Navigate to="/today" replace />} />

        {/* Main tabs */}
        <Route path="/today" element={
          <ProtectedLayout><TodayPage /></ProtectedLayout>
        } />
        <Route path="/planning" element={
          <ProtectedLayout><PlanningPage /></ProtectedLayout>
        } />
        <Route path="/optimize" element={
          <ProtectedLayout><OptimizePage /></ProtectedLayout>
        } />
        <Route path="/field" element={
          <ProtectedLayout><FieldModePage /></ProtectedLayout>
        } />
        <Route path="/alerts" element={
          <ProtectedLayout><AlertsPage /></ProtectedLayout>
        } />
        <Route path="/settings" element={
          <ProtectedLayout><SettingsPage /></ProtectedLayout>
        } />

        {/* Sub pages (no bottom nav) */}
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyFormPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/:id" element={<ReservationFormPage />} />
        <Route path="/stats" element={<StatsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
