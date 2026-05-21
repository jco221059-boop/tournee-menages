import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertTriangle, Zap, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Card, Badge, PriorityBadge, Spinner, StatCard, Button } from '../components/ui'
import { formatDuration, priorityColor } from '../lib/optimizer'
import type { CleaningJob } from '../types'
import clsx from 'clsx'

export default function TodayPage() {
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const { cleaningJobs, alerts, properties, fetchCleaningJobs, fetchAlerts, fetchProperties, updateCleaningJob, loading } = useAppStore()

  useEffect(() => {
    fetchCleaningJobs()
    fetchAlerts()
    fetchProperties()
  }, [])

  const todayJobs = cleaningJobs.filter((j) => j.scheduled_date === today)
  const urgentJobs = cleaningJobs.filter((j) =>
    (j.priority === 'critical' || j.priority === 'very_urgent') &&
    j.status !== 'completed' &&
    j.status !== 'skipped'
  )
  const pendingToday = todayJobs.filter((j) => j.status === 'pending' || j.status === 'in_progress')
  const completedToday = todayJobs.filter((j) => j.status === 'completed')
  const unreadAlerts = alerts.filter((a) => !a.resolved)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const handleToggleJob = async (job: CleaningJob) => {
    if (job.status === 'completed') {
      await updateCleaningJob(job.id, { status: 'pending', completed_at: undefined })
    } else if (job.status === 'pending') {
      await updateCleaningJob(job.id, { status: 'in_progress', started_at: new Date().toISOString() })
    } else if (job.status === 'in_progress') {
      await updateCleaningJob(job.id, { status: 'completed', completed_at: new Date().toISOString() })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-bg px-4 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-text-secondary text-sm">{greeting()}</p>
            <h1 className="text-2xl font-bold text-text-primary mt-0.5">
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </h1>
          </div>
          <button
            onClick={() => { fetchCleaningJobs(); fetchAlerts() }}
            className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="scroll-area px-4 pb-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            label="Jobs aujourd'hui"
            value={todayJobs.length}
            icon={<Clock size={18} />}
            color={pendingToday.length > 0 ? 'warning' : 'success'}
            sub={`${completedToday.length} terminé(s)`}
          />
          <StatCard
            label="Alertes actives"
            value={unreadAlerts.length}
            icon={<AlertTriangle size={18} />}
            color={unreadAlerts.length > 0 ? 'danger' : 'success'}
            sub={unreadAlerts.length === 0 ? 'Tout est OK' : 'À traiter'}
          />
        </div>

        {/* Alertes urgentes */}
        {urgentJobs.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Urgent maintenant
            </h2>
            {urgentJobs.slice(0, 3).map((job) => (
              <UrgentJobCard key={job.id} job={job} onClick={() => navigate('/planning')} />
            ))}
          </div>
        )}

        {/* Jobs d'aujourd'hui */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Programme du jour
            </h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate('/optimize')}
            >
              Optimiser
            </Button>
          </div>

          {todayJobs.length === 0 ? (
            <Card>
              <div className="text-center py-4">
                <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                <p className="text-text-primary font-medium">Aucun ménage planifié</p>
                <p className="text-text-secondary text-sm mt-1">
                  Utilisez l'optimiseur pour planifier
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/optimize')}
                >
                  Planifier la journée
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {todayJobs.map((job) => (
                <TodayJobCard
                  key={job.id}
                  job={job}
                  onToggle={() => handleToggleJob(job)}
                  onClick={() => navigate('/field')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Prochains jours */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Prochains jours
          </h2>
          {[1, 2, 3].map((offset) => {
            const date = format(addDays(new Date(), offset), 'yyyy-MM-dd')
            const dayJobs = cleaningJobs.filter((j) => j.scheduled_date === date)
            const dayLabel = offset === 1
              ? 'Demain'
              : format(addDays(new Date(), offset), 'EEEE d MMM', { locale: fr })
            if (dayJobs.length === 0) return null
            return (
              <Card
                key={date}
                pressable
                onClick={() => navigate('/planning')}
                className="mb-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary capitalize">{dayLabel}</p>
                    <p className="text-xs text-text-secondary">{dayJobs.length} ménage(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {dayJobs.some((j) => j.priority === 'critical') && (
                      <Badge variant="critical">Critique</Badge>
                    )}
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function UrgentJobCard({ job, onClick }: { job: CleaningJob; onClick: () => void }) {
  const property = job.property
  return (
    <Card pressable onClick={onClick} className="mb-2 border-l-4" style={{ borderLeftColor: priorityColor(job.priority) }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <PriorityBadge priority={job.priority} />
            {job.cleaning_window_start && (
              <span className="text-xs text-text-muted">
                {job.cleaning_window_start}–{job.cleaning_window_end}
              </span>
            )}
          </div>
          <p className="font-semibold text-text-primary truncate">
            {property?.name ?? 'Logement inconnu'}
          </p>
          <p className="text-xs text-text-secondary truncate">{property?.address}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-text-primary">{formatDuration(job.adjusted_duration_min)}</p>
          <p className="text-xs text-text-muted">{job.dirtiness}</p>
        </div>
      </div>
    </Card>
  )
}

function TodayJobCard({
  job,
  onToggle,
  onClick,
}: {
  job: CleaningJob
  onToggle: () => void
  onClick: () => void
}) {
  const property = job.property
  const isCompleted = job.status === 'completed'
  const isInProgress = job.status === 'in_progress'

  return (
    <div
      className={clsx(
        'bg-surface rounded-2xl border p-4 flex items-center gap-3 transition-colors shadow-card',
        isCompleted ? 'border-success/30 bg-success/5' : 'border-border',
        isInProgress && 'border-primary/30'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
          isCompleted ? 'bg-success text-white' : 'bg-surface-3 text-text-muted'
        )}
      >
        {isCompleted ? (
          <CheckCircle2 size={18} />
        ) : isInProgress ? (
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        ) : (
          <div className="w-4 h-4 rounded border-2 border-border" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2 mb-0.5">
          <p className={clsx('font-semibold truncate', isCompleted ? 'text-text-muted line-through' : 'text-text-primary')}>
            {property?.name ?? 'Logement'}
          </p>
          {!isCompleted && <PriorityBadge priority={job.priority} />}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{formatDuration(job.adjusted_duration_min)}</span>
          {job.cleaning_window_start && (
            <>
              <span>·</span>
              <span>{job.cleaning_window_start}–{job.cleaning_window_end}</span>
            </>
          )}
          {job.worker && (
            <>
              <span>·</span>
              <span style={{ color: job.worker.color }}>{job.worker.name}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-text-muted flex-shrink-0" onClick={onClick} />
    </div>
  )
}
