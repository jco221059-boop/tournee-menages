import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Play, CheckCircle2, Clock, MapPin, ChevronRight, Phone, AlertCircle, Navigation } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Button, Spinner, PriorityBadge } from '../components/ui'
import { formatDuration } from '../lib/optimizer'
import type { PlanStep, CleaningJob } from '../types'
import clsx from 'clsx'

export default function FieldModePage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { fetchDailyPlan, fetchWorkers, workers, updateCleaningJob } = useAppStore()
  const [steps, setSteps] = useState<PlanStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<number>()

  useEffect(() => {
    init()
    return () => clearInterval(timerRef.current)
  }, [])

  const init = async () => {
    setLoading(true)
    await fetchWorkers()
    const { steps: s } = await fetchDailyPlan(today)
    // Trouve le premier pas non terminé
    const cleaningSteps = s.filter((st) => st.step_type === 'cleaning')
    const firstPending = cleaningSteps.findIndex(
      (st) => st.cleaning_job?.status === 'pending' || st.cleaning_job?.status === 'in_progress'
    )
    const allSteps = s.sort((a, b) => a.order_index - b.order_index)
    setSteps(allSteps)
    if (firstPending >= 0) {
      const globalIdx = allSteps.findIndex(s => s.id === cleaningSteps[firstPending].id)
      setCurrentStepIndex(Math.max(0, globalIdx))
    }
    setLoading(false)
  }

  const currentStep = steps[currentStepIndex]
  const nextStep = steps[currentStepIndex + 1]
  const currentJob: CleaningJob | undefined = currentStep?.cleaning_job as CleaningJob | undefined

  const totalCleaning = steps.filter(s => s.step_type === 'cleaning').length
  const completedCleaning = steps.filter(s => s.step_type === 'cleaning' && s.cleaning_job?.status === 'completed').length

  const startTimer = () => {
    setIsRunning(true)
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
  }

  const stopTimer = () => {
    setIsRunning(false)
    clearInterval(timerRef.current)
  }

  const handleStart = async () => {
    if (!currentStep) return
    if (currentStep.step_type === 'cleaning' && currentJob) {
      await updateCleaningJob(currentJob.id, {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
    }
    setElapsed(0)
    startTimer()
  }

  const handleComplete = async () => {
    stopTimer()
    if (currentStep?.step_type === 'cleaning' && currentJob) {
      await updateCleaningJob(currentJob.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      // Reload steps
      const { steps: s } = await fetchDailyPlan(today)
      setSteps(s.sort((a, b) => a.order_index - b.order_index))
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      setElapsed(0)
    }
  }

  const handleSkip = async () => {
    stopTimer()
    if (currentStep?.step_type === 'cleaning' && currentJob) {
      await updateCleaningJob(currentJob.id, { status: 'skipped' })
    }
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      setElapsed(0)
    }
  }

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const progressPct = totalCleaning > 0 ? (completedCleaning / totalCleaning) * 100 : 0

  const openMaps = () => {
    const property = currentJob?.property
    if (!property) return
    const addr = encodeURIComponent(property.address)
    if (property.lat && property.lng) {
      window.open(`https://maps.google.com/?q=${property.lat},${property.lng}`, '_blank')
    } else {
      window.open(`https://maps.google.com/?q=${addr}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Spinner size={32} />
        <p className="text-text-secondary mt-4">Chargement du planning…</p>
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-bg px-4 pt-6 pb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-text-primary">Mode Terrain</h1>
          <p className="text-text-secondary text-sm">{format(new Date(), 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <AlertCircle size={48} className="text-text-muted mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Aucun planning actif</h2>
          <p className="text-text-secondary text-sm">
            Générez et activez un planning depuis l'optimiseur pour commencer la tournée.
          </p>
        </div>
      </div>
    )
  }

  const workerColor = currentStep?.worker?.color ?? '#4F7EFF'
  const isAllDone = completedCleaning === totalCleaning && totalCleaning > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-bg px-4 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-text-primary">Mode Terrain</h1>
          <div className="text-right">
            <p className="text-xs text-text-secondary">{completedCleaning}/{totalCleaning} ménages</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="scroll-area px-4 py-4">
        {isAllDone ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-success/20 flex items-center justify-center mb-4 shadow-glow-success">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Tournée terminée !</h2>
            <p className="text-text-secondary">{completedCleaning} ménage(s) effectué(s)</p>
          </div>
        ) : currentStep ? (
          <>
            {/* Carte étape courante */}
            <div
              className="rounded-3xl p-5 mb-4 border-2"
              style={{
                backgroundColor: `${workerColor}18`,
                borderColor: `${workerColor}40`,
              }}
            >
              {/* Type d'étape */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: workerColor }}
                >
                  {currentStep.worker?.name.charAt(0)}
                </div>
                <span className="text-sm font-medium" style={{ color: workerColor }}>
                  {currentStep.worker?.name}
                </span>
                <span className="text-xs text-text-muted ml-auto">
                  {currentStep.start_time} → {currentStep.end_time}
                </span>
              </div>

              {/* Type */}
              <div className="mb-3">
                <span className={clsx('text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full', {
                  'bg-primary/20 text-primary': currentStep.step_type === 'travel',
                  'bg-success/20 text-success': currentStep.step_type === 'cleaning',
                  'bg-surface-3 text-text-secondary': currentStep.step_type === 'break',
                })}>
                  {currentStep.step_type === 'travel' ? '🚗 Déplacement' :
                   currentStep.step_type === 'cleaning' ? '🧹 Ménage' : '☕ Pause'}
                </span>
              </div>

              {/* Infos principales */}
              {currentStep.step_type === 'cleaning' && currentJob?.property ? (
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-1">
                    {currentJob.property.name}
                  </h2>
                  <div className="flex items-start gap-1 text-text-secondary text-sm mb-3">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{currentJob.property.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <PriorityBadge priority={currentJob.priority} />
                    <span className="text-xs bg-surface-3 text-text-secondary px-2 py-0.5 rounded-full">
                      {formatDuration(currentJob.adjusted_duration_min)}
                    </span>
                    <span className="text-xs bg-surface-3 text-text-secondary px-2 py-0.5 rounded-full">
                      {currentJob.dirtiness}
                    </span>
                  </div>
                  {currentJob.property.notes && (
                    <div className="bg-bg/50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-text-secondary">{currentJob.property.notes}</p>
                    </div>
                  )}
                </div>
              ) : currentStep.step_type === 'travel' ? (
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-1">En route</h2>
                  <p className="text-text-secondary text-sm mb-4">
                    {formatDuration(currentStep.duration_min)} de trajet
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-text-primary mb-1">Pause</h2>
                  <p className="text-text-secondary text-sm mb-4">
                    {formatDuration(currentStep.duration_min)} de pause
                  </p>
                </div>
              )}

              {/* Timer */}
              {isRunning && (
                <div className="bg-bg/50 rounded-2xl p-4 text-center mb-4">
                  <p className="text-4xl font-mono font-bold text-text-primary">{formatElapsed(elapsed)}</p>
                  <p className="text-xs text-text-muted mt-1">Temps écoulé</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {!isRunning ? (
                  <Button
                    size="lg"
                    icon={<Play size={20} />}
                    onClick={handleStart}
                    className="w-full"
                  >
                    Démarrer
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="success"
                    icon={<CheckCircle2 size={20} />}
                    onClick={handleComplete}
                    className="w-full"
                  >
                    Terminer
                  </Button>
                )}

                {currentStep.step_type === 'cleaning' && currentJob?.property && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Navigation size={14} />}
                    onClick={openMaps}
                    className="w-full"
                  >
                    Ouvrir Maps
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="w-full text-text-muted"
                >
                  Passer cette étape
                </Button>
              </div>
            </div>

            {/* Étape suivante */}
            {nextStep && (
              <div className="bg-surface rounded-2xl border border-border p-4">
                <p className="text-xs text-text-muted mb-2 uppercase tracking-wide">Étape suivante</p>
                <div className="flex items-center gap-3">
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center', {
                    'bg-primary/10 text-primary': nextStep.step_type === 'travel',
                    'bg-success/10 text-success': nextStep.step_type === 'cleaning',
                    'bg-surface-3 text-text-muted': nextStep.step_type === 'break',
                  })}>
                    {nextStep.step_type === 'travel' ? <Navigation size={16} /> :
                     nextStep.step_type === 'cleaning' ? <CheckCircle2 size={16} /> :
                     <Clock size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {nextStep.step_type === 'cleaning' && nextStep.cleaning_job?.property
                        ? nextStep.cleaning_job.property.name
                        : nextStep.step_type === 'travel' ? 'Déplacement'
                        : 'Pause'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {nextStep.start_time} · {formatDuration(nextStep.duration_min)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted" />
                </div>
              </div>
            )}

            {/* Liste de toutes les étapes */}
            <div className="mt-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Toutes les étapes</p>
              {steps.map((step, i) => {
                const isDone = step.step_type === 'cleaning' && step.cleaning_job?.status === 'completed'
                const isCurrent = i === currentStepIndex
                return (
                  <div
                    key={step.id}
                    className={clsx(
                      'flex items-center gap-3 py-2 px-3 rounded-xl mb-1 transition-colors',
                      isCurrent ? 'bg-surface-2 border border-border' : '',
                      isDone ? 'opacity-50' : ''
                    )}
                  >
                    <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', {
                      'bg-success text-white': isDone,
                      'bg-primary text-white': isCurrent,
                      'bg-surface-3 text-text-muted': !isDone && !isCurrent,
                    })}>
                      {isDone ? <CheckCircle2 size={12} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx('text-sm truncate', isCurrent ? 'font-semibold text-text-primary' : 'text-text-secondary')}>
                        {step.step_type === 'cleaning' && step.cleaning_job?.property
                          ? step.cleaning_job.property.name
                          : step.step_type === 'travel' ? 'Déplacement'
                          : 'Pause'}
                      </p>
                    </div>
                    <span className="text-xs text-text-muted flex-shrink-0">{step.start_time}</span>
                  </div>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
