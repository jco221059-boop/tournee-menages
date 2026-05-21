import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Zap, Car, Coffee, Hammer, Clock, CheckCircle2, Play } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PageHeader, Button, Badge, Spinner } from '../components/ui'
import { formatDuration, stepTypeLabel } from '../lib/optimizer'
import type { DailyPlan, PlanStep } from '../types'
import clsx from 'clsx'

export default function PlanningPage() {
  const navigate = useNavigate()
  const { workers, fetchWorkers, fetchDailyPlan, updatePlanStatus } = useAppStore()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [steps, setSteps] = useState<PlanStep[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    loadPlan()
  }, [selectedDate])

  const loadPlan = async () => {
    setLoading(true)
    const { plan: p, steps: s } = await fetchDailyPlan(selectedDate)
    setPlan(p)
    setSteps(s)
    setLoading(false)
  }

  const handleActivate = async () => {
    if (!plan) return
    await updatePlanStatus(plan.id, 'in_progress')
    setPlan({ ...plan, status: 'in_progress' })
    navigate('/field')
  }

  const prevDay = () => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))
  const nextDay = () => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))

  const activeWorkers = workers.filter((w) => w.is_active)

  const stepsByWorker = (workerId: string) =>
    steps.filter((s) => s.worker_id === workerId).sort((a, b) => a.order_index - b.order_index)

  const planStatusLabel: Record<string, string> = {
    draft: 'Brouillon',
    validated: 'Validé',
    in_progress: 'En cours',
    completed: 'Terminé',
  }
  const planStatusColor: Record<string, string> = {
    draft: 'warning',
    validated: 'primary',
    in_progress: 'success',
    completed: 'default',
  }

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Planning"
        subtitle={
          plan
            ? `${plan.total_jobs} ménage(s) · ${plan.car_trips} trajet(s)`
            : 'Aucun plan généré'
        }
        action={
          plan && plan.status !== 'completed' && (
            <Badge variant={planStatusColor[plan.status] as any}>{planStatusLabel[plan.status]}</Badge>
          )
        }
      />

      {/* Navigation date */}
      <div className="flex items-center px-4 py-2 border-b border-border flex-shrink-0 gap-2">
        <button
          onClick={prevDay}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 text-text-secondary"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-text-primary capitalize">
            {format(new Date(selectedDate + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })}
          </p>
          {isToday && <p className="text-xs text-primary">Aujourd'hui</p>}
        </div>
        <button
          onClick={nextDay}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 text-text-secondary"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="scroll-area px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !plan ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
              <Zap size={28} className="text-text-muted" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">Aucun planning</h3>
            <p className="text-text-secondary text-sm mb-4">
              Utilisez l'optimiseur pour générer un planning pour cette date
            </p>
            <Button
              icon={<Zap size={16} />}
              onClick={() => navigate('/optimize')}
            >
              Aller à l'optimiseur
            </Button>
          </div>
        ) : (
          <>
            {/* Actions du plan */}
            {plan.status === 'draft' || plan.status === 'validated' ? (
              <div className="flex gap-2 mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/optimize')}
                  className="flex-1"
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  icon={<Play size={16} />}
                  onClick={handleActivate}
                  className="flex-1"
                >
                  Démarrer la tournée
                </Button>
              </div>
            ) : plan.status === 'in_progress' ? (
              <Button
                size="sm"
                icon={<Play size={16} />}
                onClick={() => navigate('/field')}
                className="w-full mb-4"
              >
                Continuer en mode terrain
              </Button>
            ) : (
              <div className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <p className="text-success font-medium text-sm">Journée terminée !</p>
                <p className="text-xs text-text-secondary ml-auto">
                  {plan.completed_jobs}/{plan.total_jobs} ménages
                </p>
              </div>
            )}

            {/* Timeline par travailleur */}
            {steps.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-8">
                Aucune étape dans ce planning
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {activeWorkers.map((worker) => {
                  const workerSteps = stepsByWorker(worker.id)
                  if (workerSteps.length === 0) return null
                  const totalWork = workerSteps.filter(s => s.step_type === 'cleaning').reduce((acc, s) => acc + s.duration_min, 0)
                  const totalTravel = workerSteps.filter(s => s.step_type === 'travel').reduce((acc, s) => acc + s.duration_min, 0)
                  return (
                    <div key={worker.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                      {/* Worker header */}
                      <div
                        className="px-4 py-3 flex items-center gap-3 border-b border-border"
                        style={{ borderTopColor: worker.color, borderTopWidth: 3 }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: worker.color }}>
                          {worker.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-text-primary">{worker.name}</p>
                          <p className="text-xs text-text-secondary">
                            {formatDuration(totalWork)} travail · {formatDuration(totalTravel)} trajet
                          </p>
                        </div>
                        <div className="text-xs text-text-muted">{workerSteps.length} étapes</div>
                      </div>

                      {/* Steps */}
                      <div className="p-4 flex flex-col gap-1">
                        {workerSteps.map((step, i) => (
                          <StepRow key={step.id} step={step} isLast={i === workerSteps.length - 1} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StepRow({ step, isLast }: { step: PlanStep; isLast: boolean }) {
  const icons: Record<string, React.ReactNode> = {
    travel: <Car size={14} />,
    cleaning: <Hammer size={14} />,
    break: <Coffee size={14} />,
    pickup: <Car size={14} />,
    dropoff: <Car size={14} />,
  }
  const bgColors: Record<string, string> = {
    travel: 'bg-primary/10 text-primary',
    cleaning: 'bg-success/10 text-success',
    break: 'bg-surface-3 text-text-muted',
    pickup: 'bg-primary/10 text-primary',
    dropoff: 'bg-primary/10 text-primary',
  }

  const job = step.cleaning_job
  const property = job?.property

  return (
    <div className="flex items-start gap-3">
      {/* Time column */}
      <div className="flex flex-col items-center w-14 flex-shrink-0 pt-1">
        <span className="text-xs font-mono text-text-secondary">{step.start_time}</span>
        {!isLast && <div className="w-px flex-1 bg-border my-0.5" style={{ minHeight: 16 }} />}
      </div>

      {/* Step card */}
      <div className={clsx('flex-1 rounded-xl px-3 py-2 mb-1 flex items-start gap-2', bgColors[step.step_type])}>
        <div className="mt-0.5 flex-shrink-0">{icons[step.step_type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {step.step_type === 'cleaning' && property
              ? property.name
              : stepTypeLabel(step.step_type)}
          </p>
          {step.step_type === 'cleaning' && property && (
            <p className="text-xs opacity-75 truncate">{property.address}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={10} />
            <span className="text-xs opacity-75">{formatDuration(step.duration_min)}</span>
            <span className="text-xs opacity-75">→ {step.end_time}</span>
          </div>
        </div>
        {step.step_type === 'cleaning' && job && (
          <div className={clsx('w-3 h-3 rounded-full mt-1 flex-shrink-0', {
            'bg-success': job.status === 'completed',
            'bg-primary animate-pulse': job.status === 'in_progress',
            'bg-border': job.status === 'pending',
          })} />
        )}
      </div>
    </div>
  )
}
