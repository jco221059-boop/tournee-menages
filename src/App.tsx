import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { BottomNav } from './components/layout/BottomNav'
import { Spinner } from './components/ui'

// Pages
import LoginPage from './pages/LoginPage'
import RoleSelectorPage from './pages/RoleSelectorPage'
import MissionsPage from './pages/MissionsPage'
import MissionDetailPage from './pages/MissionDetailPage'
import MissionFormPage from './pages/MissionFormPage'
import MissionPreviewPage from './pages/MissionPreviewPage'
import RoomCarouselPage from './pages/RoomCarouselPage'
import RoomFinalPhotoPage from './pages/RoomFinalPhotoPage'
import MissionFinalPage from './pages/MissionFinalPage'
import AnomalyPage from './pages/AnomalyPage'
import ReportPage from './pages/ReportPage'
import ConfigPage from './pages/ConfigPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyFormPage from './pages/PropertyFormPage'
import WorkflowsPage from './pages/WorkflowsPage'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import TasksPage from './pages/TasksPage'
import SettingsPage from './pages/SettingsPage'

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
  const { user, role, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
        <div className="flex flex-col items-center gap-3">
          <Spinner size={36} />
          <p className="text-sm" style={{ color: '#A8937A' }}>Chargement…</p>
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

  // Utilisateur connecté mais sans rôle → sélection du rôle
  if (!role) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<RoleSelectorPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Missions ─────────────────────────────────────── */}
        <Route path="/missions" element={
          <ProtectedLayout><MissionsPage /></ProtectedLayout>
        } />
        <Route path="/missions/new" element={
          <ProtectedLayout><MissionFormPage /></ProtectedLayout>
        } />
        <Route path="/missions/:id" element={
          <ProtectedLayout><MissionDetailPage /></ProtectedLayout>
        } />
        <Route path="/missions/:id/preview" element={
          <ProtectedLayout><MissionPreviewPage /></ProtectedLayout>
        } />
        <Route path="/missions/:id/rooms/:roomId/tasks" element={
          <RoomCarouselPage />
        } />
        <Route path="/missions/:id/rooms/:roomId/photos" element={
          <RoomFinalPhotoPage />
        } />
        <Route path="/missions/:id/final" element={
          <ProtectedLayout><MissionFinalPage /></ProtectedLayout>
        } />
        <Route path="/missions/:id/report" element={
          <ProtectedLayout><ReportPage /></ProtectedLayout>
        } />
        <Route path="/missions/:id/anomaly" element={
          <ProtectedLayout><AnomalyPage /></ProtectedLayout>
        } />

        {/* ── Config ───────────────────────────────────────── */}
        <Route path="/config" element={
          <ProtectedLayout><ConfigPage /></ProtectedLayout>
        } />
        <Route path="/config/properties" element={
          <ProtectedLayout><PropertiesPage /></ProtectedLayout>
        } />
        <Route path="/config/properties/new" element={
          <ProtectedLayout><PropertyFormPage /></ProtectedLayout>
        } />
        <Route path="/config/properties/:id" element={
          <ProtectedLayout><PropertyFormPage /></ProtectedLayout>
        } />
        <Route path="/config/workflows" element={
          <ProtectedLayout><WorkflowsPage /></ProtectedLayout>
        } />
        <Route path="/config/workflows/new" element={
          <ProtectedLayout><WorkflowEditorPage /></ProtectedLayout>
        } />
        <Route path="/config/workflows/:id" element={
          <ProtectedLayout><WorkflowEditorPage /></ProtectedLayout>
        } />
        <Route path="/config/tasks" element={
          <ProtectedLayout><TasksPage /></ProtectedLayout>
        } />

        {/* ── Réglages ─────────────────────────────────────── */}
        <Route path="/settings" element={
          <ProtectedLayout><SettingsPage /></ProtectedLayout>
        } />

        {/* ── Redirection par défaut ────────────────────────── */}
        <Route path="*" element={<Navigate to="/missions" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
