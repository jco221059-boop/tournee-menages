import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BarChart2, CheckCircle2, Clock, TrendingUp, Home, Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PageHeader, StatCard, Card } from '../components/ui'
import { formatDuration, priorityColor, priorityLabel } from '../lib/optimizer'
import type { Priority } from '../types'

export default function StatsPage() {
  const navigate = useNavigate()
  const { cleaningJobs, properties, reservations, fetchCleaningJobs, fetchProperties, fetchReservations } = useAppStore()

  useEffect(() => {
    fetchCleaningJobs()
    fetchProperties()
    fetchReservations()
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')
  const last30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const recentJobs = cleaningJobs.filter((j) => j.scheduled_date >= last30)
  const completedJobs = recentJobs.filter((j) => j.status === 'completed')
  const pendingJobs = cleaningJobs.filter((j) => j.status === 'pending' || j.status === 'in_progress')

  const totalDuration = completedJobs.reduce((acc, j) => acc + j.adjusted_duration_min, 0)
  const avgDuration = completedJobs.length > 0 ? Math.round(totalDuration / completedJobs.length) : 0

  const completionRate = recentJobs.length > 0
    ? Math.round((completedJobs.length / recentJobs.length) * 100)
    : 0

  const byPriority = useMemo(() => {
    const counts: Partial<Record<Priority, number>> = {}
    for (const job of recentJobs) {
      counts[job.priority] = (counts[job.priority] ?? 0) + 1
    }
    return counts
  }, [recentJobs])

  const byProperty = useMemo(() => {
    const counts: Record<string, { name: string; count: number; duration: number }> = {}
    for (const job of completedJobs) {
      const propId = job.property_id
      const name = job.property?.name ?? 'Inconnu'
      if (!counts[propId]) counts[propId] = { name, count: 0, duration: 0 }
      counts[propId].count++
      counts[propId].duration += job.adjusted_duration_min
    }
    return Object.values(counts).sort((a, b) => b.count - a.count)
  }, [completedJobs])

  // Activité des 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const dayJobs = cleaningJobs.filter((j) => j.scheduled_date === d)
    const completed = dayJobs.filter((j) => j.status === 'completed').length
    return {
      date: d,
      label: format(new Date(d + 'T12:00:00'), 'EEE', { locale: fr }),
      total: dayJobs.length,
      completed,
    }
  })

  const maxJobs = Math.max(...last7Days.map((d) => d.total), 1)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Statistiques"
        subtitle="30 derniers jours"
        back
        onBack={() => navigate('/settings')}
      />

      <div className="scroll-area px-4 py-4">
        {/* Stats globales */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            label="Ménages réalisés"
            value={completedJobs.length}
            icon={<CheckCircle2 size={18} />}
            color="success"
            sub={`/${recentJobs.length} planifiés`}
          />
          <StatCard
            label="Taux de complétion"
            value={`${completionRate}%`}
            icon={<TrendingUp size={18} />}
            color={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'warning' : 'danger'}
          />
          <StatCard
            label="Durée totale"
            value={formatDuration(totalDuration)}
            icon={<Clock size={18} />}
            color="primary"
          />
          <StatCard
            label="Durée moyenne"
            value={avgDuration > 0 ? formatDuration(avgDuration) : '—'}
            icon={<BarChart2 size={18} />}
            color="primary"
            sub="par ménage"
          />
        </div>

        {/* Activité des 7 jours */}
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Activité (7 derniers jours)
          </h2>
          <div className="flex items-end gap-2 h-24">
            {last7Days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end flex-1 gap-0.5">
                  {day.total > 0 && (
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${(day.total / maxJobs) * 100}%`,
                        backgroundColor: day.completed === day.total && day.total > 0
                          ? '#3ECF6B'
                          : '#4F7EFF',
                        opacity: day.date === today ? 1 : 0.7,
                      }}
                    />
                  )}
                  {day.total === 0 && (
                    <div className="w-full rounded-t-lg bg-surface-3" style={{ height: 4 }} />
                  )}
                </div>
                <span className="text-[10px] text-text-muted">{day.label}</span>
                {day.total > 0 && (
                  <span className="text-[10px] font-bold text-text-secondary">{day.completed}/{day.total}</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Répartition par priorité */}
        {Object.keys(byPriority).length > 0 && (
          <Card className="mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Par priorité
            </h2>
            {(['critical', 'very_urgent', 'urgent', 'plannable', 'flexible'] as Priority[]).map((p) => {
              const count = byPriority[p] ?? 0
              if (count === 0) return null
              const pct = recentJobs.length > 0 ? (count / recentJobs.length) * 100 : 0
              return (
                <div key={p} className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityColor(p) }} />
                  <span className="text-sm text-text-secondary w-24 flex-shrink-0">{priorityLabel(p)}</span>
                  <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: priorityColor(p) }}
                    />
                  </div>
                  <span className="text-xs font-bold text-text-primary w-6 text-right">{count}</span>
                </div>
              )
            })}
          </Card>
        )}

        {/* Top logements */}
        {byProperty.length > 0 && (
          <Card className="mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Logements les plus nettoyés
            </h2>
            {byProperty.slice(0, 5).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-text-secondary">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                  <p className="text-xs text-text-muted">{formatDuration(p.duration)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-text-primary">
                  <Home size={11} className="text-text-muted" />
                  {p.count}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* En attente */}
        {pendingJobs.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
              En attente ({pendingJobs.length})
            </h2>
            <p className="text-text-secondary text-xs">
              {pendingJobs.length} ménage(s) à venir — pensez à optimiser le planning !
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
