import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Calendar, User, LogOut, ChevronRight, Save, Clock, Car, Coffee, Palmtree } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/appStore'
import { PageHeader, Button, Input, Toggle } from '../components/ui'
import type { Worker } from '../types'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { signOut, user } = useAuthStore()
  const { settings, workers, fetchSettings, fetchWorkers, updateSettings, updateWorker } = useAppStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchWorkers()
  }, [])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    await updateSettings(localSettings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    if (!confirm('Se déconnecter ?')) return
    await signOut()
  }

  const setSetting = (key: keyof typeof settings, value: string | number) => {
    setLocalSettings((s) => ({ ...s, [key]: value }))
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Paramètres" />

      <div className="scroll-area px-4 py-4">
        {/* Navigation */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden mb-4">
          <NavItem
            icon={<Home size={18} className="text-primary" />}
            label="Logements"
            sub={`${workers.length > 0 ? '' : ''}Gérer les logements Airbnb`}
            onClick={() => navigate('/properties')}
          />
          <NavItem
            icon={<Calendar size={18} className="text-success" />}
            label="Réservations"
            sub="Gérer les réservations"
            onClick={() => navigate('/reservations')}
          />
          <NavItem
            icon={<Palmtree size={18} className="text-warning" />}
            label="Statistiques"
            sub="Voir les statistiques"
            onClick={() => navigate('/stats')}
            last
          />
        </div>

        {/* Travailleurs */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Équipe</h2>
          {workers.map((w) => (
            <WorkerRow key={w.id} worker={w} onToggle={(active) => updateWorker(w.id, { is_active: active })} />
          ))}
        </div>

        {/* Horaires */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Horaires de travail</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input
              label="Début journée"
              type="time"
              value={localSettings.start_time}
              onChange={(e) => setSetting('start_time', e.target.value)}
            />
            <Input
              label="Fin journée"
              type="time"
              value={localSettings.end_time}
              onChange={(e) => setSetting('end_time', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Max travail (h)</label>
              <input
                type="number"
                value={localSettings.max_work_hours}
                onChange={(e) => setSetting('max_work_hours', Number(e.target.value))}
                min="1" max="12"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text-primary h-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Max trajet (h)</label>
              <input
                type="number"
                value={localSettings.max_travel_hours}
                onChange={(e) => setSetting('max_travel_hours', Number(e.target.value))}
                min="0.5" max="4" step="0.5"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text-primary h-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Pause min (h)</label>
              <input
                type="number"
                value={localSettings.min_break_hours}
                onChange={(e) => setSetting('min_break_hours', Number(e.target.value))}
                min="0.5" max="4" step="0.5"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text-primary h-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Horaires Airbnb */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Horaires Airbnb</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Checkout standard"
              type="time"
              value={localSettings.checkout_time}
              onChange={(e) => setSetting('checkout_time', e.target.value)}
            />
            <Input
              label="Checkin standard"
              type="time"
              value={localSettings.checkin_time}
              onChange={(e) => setSetting('checkin_time', e.target.value)}
            />
          </div>
        </div>

        {/* Adresse de départ */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Point de départ</h2>
          <Input
            label="Adresse domicile"
            value={localSettings.home_address}
            onChange={(e) => setSetting('home_address', e.target.value)}
            placeholder="Votre adresse de départ…"
          />
        </div>

        {/* Sauvegarder */}
        <Button
          size="lg"
          loading={saving}
          icon={saved ? undefined : <Save size={18} />}
          onClick={handleSave}
          variant={saved ? 'success' : 'primary'}
          className="w-full mb-4"
        >
          {saved ? 'Paramètres sauvegardés !' : 'Sauvegarder les paramètres'}
        </Button>

        {/* Compte */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden mb-6">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Connecté</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 flex items-center gap-3 text-danger hover:bg-danger/5 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>

        <p className="text-center text-xs text-text-muted pb-2">Tournée Ménages v1.0</p>
      </div>
    </div>
  )
}

function NavItem({
  icon, label, sub, onClick, last,
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left ${!last ? 'border-b border-border' : ''}`}
    >
      <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
      <ChevronRight size={16} className="text-text-muted" />
    </button>
  )
}

function WorkerRow({ worker, onToggle }: { worker: Worker; onToggle: (active: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: worker.color }}
      >
        {worker.name.charAt(0)}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{worker.name}</p>
        <p className="text-xs text-text-muted">Prestataire</p>
      </div>
      <Toggle
        checked={worker.is_active}
        onChange={onToggle}
      />
    </div>
  )
}
