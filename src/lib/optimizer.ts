import type {
  CleaningJob,
  Worker,
  Priority,
  DirtinessLevel,
  AppSettings,
  OptimizationInput,
  OptimizationResult,
  PlanStep,
} from '../types'

// ============================================================
// Constantes
// ============================================================

const DIRTINESS_COEFFICIENTS: Record<DirtinessLevel, number> = {
  clean: 0.75,
  normal: 1.0,
  dirty: 1.35,
}

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  very_urgent: 1,
  urgent: 2,
  plannable: 3,
  flexible: 4,
}

const DEFAULT_TRAVEL_MIN = 20
const BREAK_TRIGGER_MIN = 180 // Pause après 3h de travail continu

// ============================================================
// Helpers temps
// ============================================================

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ============================================================
// Calcul de priorité
// ============================================================

export function calculatePriority(checkInDate: string, now: Date): Priority {
  const checkIn = new Date(checkInDate + 'T15:00:00')
  const diffHours = (checkIn.getTime() - now.getTime()) / 3_600_000

  if (diffHours < 0) return 'critical'
  if (diffHours < 8) return 'critical'
  if (diffHours < 24) return 'very_urgent'
  if (diffHours < 48) return 'urgent'
  if (diffHours < 120) return 'plannable'
  return 'flexible'
}

export function priorityLabel(p: Priority): string {
  const labels: Record<Priority, string> = {
    critical: 'Critique',
    very_urgent: 'Très urgent',
    urgent: 'Urgent',
    plannable: 'Planifiable',
    flexible: 'Flexible',
  }
  return labels[p]
}

// ============================================================
// Durée ajustée selon saleté
// ============================================================

export function adjustDuration(baseDurationMin: number, dirtiness: DirtinessLevel): number {
  return Math.round(baseDurationMin * DIRTINESS_COEFFICIENTS[dirtiness])
}

// ============================================================
// Fenêtre de ménage
// ============================================================

export function calculateCleaningWindow(
  checkOutDate: string,
  nextCheckInDate: string | null,
  settings: Pick<AppSettings, 'checkout_time' | 'checkin_time'>
): { start: string; end: string } {
  const windowStart = settings.checkout_time || '11:00'
  const windowEnd = nextCheckInDate ? settings.checkin_time || '15:00' : '22:00'
  return { start: windowStart, end: windowEnd }
}

// ============================================================
// Génération des alertes
// ============================================================

export interface GeneratedAlert {
  type: 'conflict' | 'missing_cleaning' | 'overlap' | 'tight_window'
  severity: 'error' | 'warning' | 'info'
  message: string
  property_id?: string
  reservation_id?: string
  date?: string
}

export function generateAlerts(
  reservations: Array<{
    id: string
    property_id: string
    check_in: string
    check_out: string
    guest_name: string
    status: string
  }>,
  cleaningJobs: Array<{
    id: string
    property_id: string
    reservation_id?: string | null
    scheduled_date: string
    status: string
    cleaning_window_start?: string | null
    cleaning_window_end?: string | null
  }>,
  today: string
): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = []

  for (const res of reservations) {
    if (res.status === 'cancelled') continue

    // Vérification ménage manquant après checkout
    const checkOutDate = res.check_out
    if (checkOutDate <= today) {
      const hasJob = cleaningJobs.some(
        (j) =>
          j.reservation_id === res.id &&
          j.status !== 'skipped' &&
          j.status !== 'completed'
      )
      if (!hasJob) {
        const checkIn = new Date(res.check_in + 'T15:00:00')
        const nowMs = new Date(today + 'T00:00:00').getTime()
        const diffH = (checkIn.getTime() - nowMs) / 3_600_000
        alerts.push({
          type: 'missing_cleaning',
          severity: diffH < 8 ? 'error' : 'warning',
          message: `Ménage manquant pour ${res.guest_name} (check-in ${res.check_in})`,
          property_id: res.property_id,
          reservation_id: res.id,
          date: res.check_out,
        })
      }
    }

    // Vérification fenêtre trop courte
    for (const job of cleaningJobs) {
      if (job.reservation_id !== res.id) continue
      if (!job.cleaning_window_start || !job.cleaning_window_end) continue
      const windowDuration =
        parseTime(job.cleaning_window_end) - parseTime(job.cleaning_window_start)
      if (windowDuration < 120) {
        alerts.push({
          type: 'tight_window',
          severity: windowDuration < 60 ? 'error' : 'warning',
          message: `Fenêtre de ménage très courte (${windowDuration}min) pour ${res.guest_name}`,
          property_id: res.property_id,
          reservation_id: res.id,
          date: job.scheduled_date,
        })
      }
    }
  }

  // Vérification chevauchements par logement
  const byProperty: Record<string, typeof reservations> = {}
  for (const r of reservations) {
    if (!byProperty[r.property_id]) byProperty[r.property_id] = []
    byProperty[r.property_id].push(r)
  }

  for (const [propId, ress] of Object.entries(byProperty)) {
    const sorted = [...ress].sort((a, b) => a.check_in.localeCompare(b.check_in))
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].check_out > sorted[i + 1].check_in) {
        alerts.push({
          type: 'overlap',
          severity: 'error',
          message: `Chevauchement de réservations : ${sorted[i].guest_name} et ${sorted[i + 1].guest_name}`,
          property_id: propId,
          date: sorted[i + 1].check_in,
        })
      }
    }
  }

  return alerts
}

// ============================================================
// Moteur d'optimisation principal
// ============================================================

interface WorkerState {
  workerId: string
  currentMin: number
  totalWorkMin: number
  totalTravelMin: number
  workSinceBreakMin: number
  steps: Array<Omit<PlanStep, 'id' | 'daily_plan_id'>>
}

export function optimizeDailyPlan(input: OptimizationInput): OptimizationResult {
  const { date, jobs, workers, settings } = input

  const startMin = parseTime(settings.start_time || '08:00')
  const endMin = parseTime(settings.end_time || '18:00')
  const maxWorkMin = (settings.max_work_hours || 6) * 60
  const maxTravelMin = (settings.max_travel_hours || 1) * 60
  const minBreakMin = (settings.min_break_hours || 1) * 60

  const activeWorkers = workers.filter((w) => w.is_active)
  if (activeWorkers.length === 0) {
    return {
      steps: [],
      warnings: ['Aucun travailleur actif disponible'],
      totalJobsScheduled: 0,
      totalJobsSkipped: jobs.length,
      carTrips: 0,
      skippedJobs: jobs,
    }
  }

  // Initialiser l'état des travailleurs
  const workerStates: WorkerState[] = activeWorkers.map((w) => ({
    workerId: w.id,
    currentMin: startMin,
    totalWorkMin: 0,
    totalTravelMin: 0,
    workSinceBreakMin: 0,
    steps: [],
  }))

  // Voiture partagée : disponible à startMin
  let carAvailableMin = startMin
  let carTrips = 0

  // Trier les jobs par priorité puis par heure de fenêtre
  const sortedJobs = [...jobs].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority]
    const pb = PRIORITY_ORDER[b.priority]
    if (pa !== pb) return pa - pb
    const wa = a.cleaning_window_start ? parseTime(a.cleaning_window_start) : 0
    const wb = b.cleaning_window_start ? parseTime(b.cleaning_window_start) : 0
    return wa - wb
  })

  const scheduledJobs: CleaningJob[] = []
  const skippedJobs: CleaningJob[] = []
  const warnings: string[] = []

  for (const job of sortedJobs) {
    const windowStart = job.cleaning_window_start ? parseTime(job.cleaning_window_start) : startMin
    const windowEnd = job.cleaning_window_end ? parseTime(job.cleaning_window_end) : endMin
    const jobDuration = job.adjusted_duration_min

    let assigned = false

    // Trouver le travailleur optimal (peut commencer le plus tôt)
    let bestWorker: WorkerState | null = null
    let bestDeparture = Infinity
    let bestArrival = Infinity
    let bestActualStart = Infinity

    for (const ws of workerStates) {
      // Vérifier contraintes du travailleur
      if (ws.totalWorkMin >= maxWorkMin) continue
      if (ws.totalTravelMin >= maxTravelMin) continue

      // Temps de déplacement (estimé ou par défaut)
      const travelMin = DEFAULT_TRAVEL_MIN

      // La voiture ET le travailleur doivent être disponibles
      const departure = Math.max(ws.currentMin, carAvailableMin)
      const arrival = departure + travelMin
      const actualStart = Math.max(arrival, windowStart)
      const actualEnd = actualStart + jobDuration

      // Vérifier que ça rentre dans la fenêtre
      if (actualStart > windowEnd) continue
      if (actualEnd > windowEnd) continue
      if (actualEnd > endMin) continue

      // Vérifier capacité de travail restante
      const remainingWork = maxWorkMin - ws.totalWorkMin
      if (jobDuration > remainingWork) continue

      if (departure < bestDeparture) {
        bestDeparture = departure
        bestArrival = arrival
        bestActualStart = actualStart
        bestWorker = ws
      }
    }

    if (!bestWorker) {
      skippedJobs.push(job)
      warnings.push(`Job "${job.property_id}" ignoré (pas de créneau disponible)`)
      continue
    }

    const ws = bestWorker
    const travelMin = DEFAULT_TRAVEL_MIN

    // Pause obligatoire si travail continu > seuil
    if (ws.workSinceBreakMin >= BREAK_TRIGGER_MIN && ws.currentMin < bestActualStart) {
      const breakDuration = Math.min(30, bestActualStart - ws.currentMin)
      if (breakDuration >= 15) {
        ws.steps.push({
          cleaning_job_id: null,
          worker_id: ws.workerId,
          step_type: 'break',
          start_time: formatTime(ws.currentMin),
          end_time: formatTime(ws.currentMin + breakDuration),
          duration_min: breakDuration,
          order_index: ws.steps.length,
          notes: 'Pause',
        })
        ws.currentMin += breakDuration
        ws.workSinceBreakMin = 0
      }
    }

    // Déplacement
    if (travelMin > 0 && ws.currentMin < bestActualStart) {
      ws.steps.push({
        cleaning_job_id: null,
        worker_id: ws.workerId,
        step_type: 'travel',
        start_time: formatTime(bestDeparture),
        end_time: formatTime(bestArrival),
        duration_min: travelMin,
        order_index: ws.steps.length,
        notes: `Trajet vers ${job.property_id}`,
      })
      ws.totalTravelMin += travelMin
      carAvailableMin = bestArrival
      carTrips++
    }

    // Attente si fenêtre pas encore ouverte
    if (bestActualStart > bestArrival) {
      ws.steps.push({
        cleaning_job_id: null,
        worker_id: ws.workerId,
        step_type: 'break',
        start_time: formatTime(bestArrival),
        end_time: formatTime(bestActualStart),
        duration_min: bestActualStart - bestArrival,
        order_index: ws.steps.length,
        notes: 'Attente ouverture fenêtre',
      })
    }

    // Ménage
    const cleanEnd = bestActualStart + job.adjusted_duration_min
    ws.steps.push({
      cleaning_job_id: job.id,
      worker_id: ws.workerId,
      step_type: 'cleaning',
      start_time: formatTime(bestActualStart),
      end_time: formatTime(cleanEnd),
      duration_min: job.adjusted_duration_min,
      order_index: ws.steps.length,
      notes: null,
    })

    ws.currentMin = cleanEnd
    ws.totalWorkMin += job.adjusted_duration_min
    ws.workSinceBreakMin += job.adjusted_duration_min
    carAvailableMin = cleanEnd

    scheduledJobs.push(job)
    assigned = true

    if (!assigned) skippedJobs.push(job)
  }

  // Ajouter pauses de fin de journée si durée totale < minBreakMin
  for (const ws of workerStates) {
    const totalMin = ws.currentMin - startMin
    const totalBreakMin = totalMin - ws.totalWorkMin - ws.totalTravelMin
    if (totalBreakMin < minBreakMin && ws.steps.length > 0) {
      warnings.push(
        `${ws.workerId}: pause totale ${totalBreakMin}min < minimum requis ${minBreakMin}min`
      )
    }
  }

  const allSteps = workerStates.flatMap((ws) => ws.steps)

  return {
    steps: allSteps,
    warnings,
    totalJobsScheduled: scheduledJobs.length,
    totalJobsSkipped: skippedJobs.length,
    carTrips,
    skippedJobs,
  }
}

// ============================================================
// Utilitaires UI
// ============================================================

export function priorityColor(p: Priority): string {
  const colors: Record<Priority, string> = {
    critical: '#FF5757',
    very_urgent: '#F5A623',
    urgent: '#4F7EFF',
    plannable: '#3ECF6B',
    flexible: '#8B8FA8',
  }
  return colors[p]
}

export function dirtinessLabel(d: DirtinessLevel): string {
  const labels: Record<DirtinessLevel, string> = {
    clean: 'Propre',
    normal: 'Normal',
    dirty: 'Sale',
  }
  return labels[d]
}

export function stepTypeLabel(s: string): string {
  const labels: Record<string, string> = {
    travel: 'Déplacement',
    cleaning: 'Ménage',
    break: 'Pause',
    pickup: 'Prise en charge',
    dropoff: 'Dépose',
  }
  return labels[s] ?? s
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}
