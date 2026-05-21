import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Zap, CheckCircle2, AlertTriangle, ChevronRight, Calendar, Clock, Car } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { optimizeDailyPlan, adjustDuration, calculatePriority, calculateCleaningWindow, formatDuration } from '../lib/optimizer'
import { PageHeader, Button, Select, Card, Badge, PriorityBadge, StatCard, Spinner } from '../components/ui'
import type { CleaningJob, OptimizationResult } from '../types'
import clsx from 'clsx'

export default function OptimizePage() {
  const navigate = useNavigate()
  const { cleaningJobs, workers, properties, reservations, settings, fetchCleaningJobs, fetchWorkers, fetchProperties, fetchReservations, fetchSettings, saveDailyPlan, addCleaningJob } = useAppStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchWorkers()
    fetchProperties()
    fetchReservations()
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchCleaningJobs(selectedDate)
    setResult(null)
    setSaved(false)
  }, [selectedDate])

  const dateJobs = cleaningJobs.filter((j) => j.scheduled_date === selectedDate && j.status !== 'completed' && j.status !== 'skipped')

  const handleGenerate = async () => {
    setLoading(true)
    try {
      // Générer jobs manquants depuis réservations
      const existingJobReservationIds = new Set(cleaningJobs.filter(j => j.reservation_id).map(j => j.reservation_id))
      const checkoutsOnDate = reservations.filter(r => r.check_out === selectedDate && !existingJobReservationIds.has(r.id) && r.status !== 'cancelled')

      for (const r of checkoutsOnDate) {
        const property = properties.find(p => p.id === r.property_id)
        if (!property) continue
        const priority = calculatePriority(r.check_in, new Date(selectedDate + 'T00:00:00'))
        const window = calculateCleaningWindow(r.check_out, null, settings)
        const duration = adjustDuration(property.base_cleaning_duration_min, 'normal')
        await addCleaningJob({
          reservation_id: r.id,
          property_id: r.property_id,
          scheduled_date: selectedDate,
          priority,
          dirtiness: 'normal',
          adjusted_duration_min: duration,
          cleaning_window_start: window.start,
          cleaning_window_end: window.end,
          assigned_worker_id: null,
          status: 'pending',
          notes: null,
        })
      }

      await fetchCleaningJobs(selectedDate)
      const jobs = cleaningJobs.filter(j => j.scheduled_date === selectedDate)
      const res = optimizeDailyPlan({ date: selectedDate, jobs, workers, settings })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!result) return
    setSaving(true)
    try {
      await saveDailyPlan(selectedDate, result.steps, result.totalJobsScheduled, result.carTrips)
      setSaved(true)
      setTimeout(() => navigate('/planning'), 800)
    } catch (err) {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    const val = format(d, 'yyyy-MM-dd')
    let label = format(d, 'EEEE d MMM', { locale: fr })
    if (i === 0) label = "Aujourd'hui — " + label
    if (i === 1) label = "Demain — " + label
    return { value: val, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Optimiser"
        subtitle="Générer le planning optimal"
      />

      <div className="scroll-area px-4 py-4">
        {/* Sélection de date */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <label className="text-sm font-medium text-text-secondary block mb-2">Date à planifier</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary h-11 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {dateOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-surface-2">{o.label}</option>
            ))}
          </select>
        </div>

        {/* Jobs disponibles */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Ménages ({dateJobs.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<Calendar size={14} />}
              onClick={() => navigate('/reservations')}
            >
              Réservations
            </Button>
          </div>

          {dateJobs.length === 0 ? (
            <Card>
              <div className="text-center py-4">
                <CheckCircle2 size={28} className="text-text-muted mx-auto mb-2" />
                <p className="text-text-secondary text-sm">Aucun ménage planifié pour cette date</p>
                <p className="text-xs text-text-muted mt-1">
                  Les checkouts de réservations seront détectés automatiquement
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {dateJobs.map((job) => (
                <JobPreviewCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Travailleurs */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Équipe</h2>
          <div className="flex gap-2 flex-wrap">
            {workers.filter(w => w.is_active).map(w => (
              <div key={w.id} className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                <span className="text-sm font-medium text-text-primary">{w.name}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-surface-2 rounded-xl p-2">
              <p className="text-lg font-bold text-text-primary">{settings.max_work_hours}h</p>
              <p className="text-[10px] text-text-muted">max travail</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-2">
              <p className="text-lg font-bold text-text-primary">{settings.max_travel_hours}h</p>
              <p className="text-[10px] text-text-muted">max trajet</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-2">
              <p className="text-lg font-bold text-text-primary">{settings.min_break_hours}h</p>
              <p className="text-[10px] text-text-muted">pause min</p>
            </div>
          </div>
        </div>

        {/* Bouton Générer */}
        <Button
          size="lg"
          loading={loading}
          icon={<Zap size={18} />}
          onClick={handleGenerate}
          className="w-full mb-4"
        >
          Générer le planning optimal
        </Button>

        {/* Résultats */}
        {result && (
          <div className="flex flex-col gap-4 animate-slide-up">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Planifiés"
                value={result.totalJobsScheduled}
                icon={<CheckCircle2 size={16} />}
                color="success"
              />
              <StatCard
                label="Ignorés"
                value={result.totalJobsSkipped}
                icon={<AlertTriangle size={16} />}
                color={result.totalJobsSkipped > 0 ? 'danger' : 'success'}
              />
              <StatCard
                label="Trajets"
                value={result.carTrips}
                icon={<Car size={16} />}
                color="primary"
              />
            </div>

            {/* Avertissements */}
            {result.warnings.length > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-warning" />
                  <p className="text-sm font-semibold text-warning">Avertissements</p>
                </div>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-text-secondary">{w}</p>
                ))}
              </div>
            )}

            {/* Planning généré par travailleur */}
            {workers.filter(w => w.is_active).map(worker => {
              const workerSteps = result.steps.filter(s => s.worker_id === worker.id)
              if (workerSteps.length === 0) return null
              return (
                <div key={worker.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2" style={{ borderLeftColor: worker.color, borderLeftWidth: 4 }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: worker.color }} />
                    <span className="font-semibold text-text-primary">{worker.name}</span>
                    <span className="text-xs text-text-muted ml-auto">
                      {workerSteps.length} étape(s)
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {workerSteps.map((step, i) => {
                      const job = step.cleaning_job_id ? cleaningJobs.find(j => j.id === step.cleaning_job_id) : null
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 w-14 flex-shrink-0">
                            <span className="text-xs font-mono text-text-secondary">{step.start_time}</span>
                            <div className="w-px h-4 bg-border" />
                            <span className="text-xs font-mono text-text-muted">{step.end_time}</span>
                          </div>
                          <div className={clsx('flex-1 rounded-xl px-3 py-2 text-sm', {
                            'bg-primary/10 text-primary': step.step_type === 'travel',
                            'bg-success/10 text-success': step.step_type === 'cleaning',
                            'bg-surface-3 text-text-secondary': step.step_type === 'break',
                          })}>
                            <p className="font-medium">
                              {step.step_type === 'cleaning' && job?.property?.name
                                ? job.property.name
                                : step.step_type === 'travel' ? '🚗 Déplacement'
                                : '☕ Pause'}
                            </p>
                            <p className="text-xs opacity-75">{formatDuration(step.duration_min)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Jobs ignorés */}
            {result.skippedJobs.length > 0 && (
              <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4">
                <p className="text-sm font-semibold text-danger mb-2">
                  {result.skippedJobs.length} ménage(s) non planifié(s)
                </p>
                {result.skippedJobs.map(job => (
                  <p key={job.id} className="text-xs text-text-secondary">
                    • {job.property?.name ?? job.property_id}
                  </p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleGenerate}
                className="flex-1"
              >
                Regénérer
              </Button>
              <Button
                variant={saved ? 'success' : 'primary'}
                loading={saving}
                icon={saved ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                onClick={handleValidate}
                className="flex-1"
              >
                {saved ? 'Sauvegardé !' : 'Valider et sauvegarder'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function JobPreviewCard({ job }: { job: CleaningJob }) {
  return (
    <div className="bg-surface-2 rounded-xl p-3 flex items-center gap-3">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <PriorityBadge priority={job.priority} />
          <span className="text-xs text-text-muted">
            {job.cleaning_window_start} – {job.cleaning_window_end}
          </span>
        </div>
        <p className="text-sm font-medium text-text-primary">{job.property?.name ?? job.property_id}</p>
        <p className="text-xs text-text-muted">{formatDuration(job.adjusted_duration_min)} · {job.dirtiness}</p>
      </div>
    </div>
  )
}
