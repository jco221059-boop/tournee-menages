import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAppStore } from '../store/appStore'
import { generateAlerts } from '../lib/optimizer'
import { PageHeader, Button, EmptyState, Spinner, Badge } from '../components/ui'
import type { Alert, AlertSeverity, AlertType } from '../types'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

const TYPE_LABELS: Record<AlertType, string> = {
  conflict: 'Conflit',
  missing_cleaning: 'Ménage manquant',
  overlap: 'Chevauchement',
  tight_window: 'Fenêtre serrée',
}

export default function AlertsPage() {
  const { alerts, reservations, cleaningJobs, fetchAlerts, fetchReservations, fetchCleaningJobs, resolveAlert, clearResolvedAlerts } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all')

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAlerts(), fetchReservations(), fetchCleaningJobs()]).finally(() =>
      setLoading(false)
    )
  }, [])

  const handleGenerateAlerts = async () => {
    setGenerating(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const generated = generateAlerts(reservations, cleaningJobs, today)

      // Supprimer les anciennes alertes non résolues du même type
      await supabase.from('alerts').delete().eq('resolved', false)

      // Insérer les nouvelles
      if (generated.length > 0) {
        await supabase.from('alerts').insert(
          generated.map((a) => ({
            type: a.type,
            severity: a.severity,
            message: a.message,
            property_id: a.property_id ?? null,
            reservation_id: a.reservation_id ?? null,
            date: a.date ?? null,
          }))
        )
      }

      await fetchAlerts()
    } finally {
      setGenerating(false)
    }
  }

  const handleResolveAll = async () => {
    for (const a of alerts) {
      await resolveAlert(a.id)
    }
  }

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Alertes"
        subtitle={`${alerts.length} alerte(s) active(s)`}
        action={
          <Button
            variant="secondary"
            size="sm"
            loading={generating}
            icon={<RefreshCw size={14} />}
            onClick={handleGenerateAlerts}
          >
            Analyser
          </Button>
        }
      />

      {/* Filtres */}
      <div className="px-4 py-2 flex gap-2 border-b border-border flex-shrink-0">
        {(['all', 'error', 'warning', 'info'] as const).map((f) => {
          const counts = {
            all: alerts.length,
            error: alerts.filter(a => a.severity === 'error').length,
            warning: alerts.filter(a => a.severity === 'warning').length,
            info: alerts.filter(a => a.severity === 'info').length,
          }
          const labels = { all: 'Tout', error: 'Erreurs', warning: 'Warnings', info: 'Infos' }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-surface-2 text-text-secondary'
              )}
            >
              {labels[f]}
              {counts[f] > 0 && (
                <span className={clsx('text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1',
                  filter === f ? 'bg-white/20 text-white' : 'bg-surface-3 text-text-muted'
                )}>
                  {counts[f]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="scroll-area px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={28} className="text-success" />}
            title="Aucune alerte"
            description={
              filter === 'all'
                ? "Tout est en ordre ! Cliquez sur Analyser pour vérifier les réservations."
                : "Aucune alerte de ce type."
            }
            action={
              filter === 'all' && (
                <Button
                  variant="secondary"
                  icon={<RefreshCw size={16} />}
                  onClick={handleGenerateAlerts}
                >
                  Analyser les réservations
                </Button>
              )
            }
          />
        ) : (
          <>
            {alerts.length > 1 && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResolveAll}
                  className="text-text-secondary"
                >
                  Tout résoudre
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearResolvedAlerts()}
                  className="text-text-muted"
                >
                  Nettoyer
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {filtered.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={() => resolveAlert(alert.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AlertCard({ alert, onResolve }: { alert: Alert; onResolve: () => void }) {
  const Icon = alert.severity === 'error'
    ? AlertCircle
    : alert.severity === 'warning'
    ? AlertTriangle
    : Info

  const colors = {
    error: { bg: 'bg-danger/10', border: 'border-danger/30', icon: 'text-danger', iconBg: 'bg-danger/20' },
    warning: { bg: 'bg-warning/10', border: 'border-warning/30', icon: 'text-warning', iconBg: 'bg-warning/20' },
    info: { bg: 'bg-primary/10', border: 'border-primary/30', icon: 'text-primary', iconBg: 'bg-primary/20' },
  }

  const c = colors[alert.severity]

  return (
    <div className={clsx('rounded-2xl border p-4', c.bg, c.border)}>
      <div className="flex items-start gap-3">
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', c.iconBg)}>
          <Icon size={18} className={c.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={clsx('text-xs font-bold uppercase tracking-wide', c.icon)}>
              {TYPE_LABELS[alert.type] ?? alert.type}
            </span>
            {alert.date && (
              <span className="text-xs text-text-muted">
                {format(new Date(alert.date + 'T12:00:00'), 'd MMM', { locale: fr })}
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary font-medium leading-snug">{alert.message}</p>
          <p className="text-xs text-text-muted mt-1">
            {format(new Date(alert.created_at), 'd MMM à HH:mm', { locale: fr })}
          </p>
        </div>
        <button
          onClick={onResolve}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/20 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          <CheckCircle2 size={16} />
        </button>
      </div>
    </div>
  )
}
