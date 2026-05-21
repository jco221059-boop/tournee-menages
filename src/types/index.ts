export type Priority = 'critical' | 'very_urgent' | 'urgent' | 'plannable' | 'flexible'
export type DirtinessLevel = 'clean' | 'normal' | 'dirty'
export type Platform = 'airbnb' | 'booking' | 'direct' | 'other'
export type ReservationStatus = 'pending' | 'confirmed' | 'cleaning_needed' | 'cleaned' | 'cancelled'
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type PlanStatus = 'draft' | 'validated' | 'in_progress' | 'completed'
export type StepType = 'travel' | 'cleaning' | 'break' | 'pickup' | 'dropoff'
export type AlertType = 'conflict' | 'missing_cleaning' | 'overlap' | 'tight_window'
export type AlertSeverity = 'error' | 'warning' | 'info'

export interface Worker {
  id: string
  name: string
  color: string
  is_active: boolean
  created_at: string
}

export interface Property {
  id: string
  name: string
  address: string
  lat?: number | null
  lng?: number | null
  surface_m2: number
  bedrooms: number
  bathrooms: number
  base_cleaning_duration_min: number
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  property_id: string
  property?: Property
  guest_name: string
  check_in: string
  check_out: string
  num_guests: number
  platform: Platform
  status: ReservationStatus
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CleaningJob {
  id: string
  reservation_id?: string | null
  reservation?: Reservation
  property_id: string
  property?: Property
  scheduled_date: string
  priority: Priority
  dirtiness: DirtinessLevel
  adjusted_duration_min: number
  cleaning_window_start?: string | null
  cleaning_window_end?: string | null
  assigned_worker_id?: string | null
  worker?: Worker
  status: JobStatus
  notes?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface DailyPlan {
  id: string
  date: string
  status: PlanStatus
  total_jobs: number
  completed_jobs: number
  car_trips: number
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface PlanStep {
  id: string
  daily_plan_id: string
  cleaning_job_id?: string | null
  cleaning_job?: CleaningJob
  worker_id: string
  worker?: Worker
  step_type: StepType
  start_time: string
  end_time: string
  duration_min: number
  order_index: number
  notes?: string | null
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  property_id?: string | null
  reservation_id?: string | null
  date?: string | null
  resolved: boolean
  created_at: string
}

export interface AppSettings {
  start_time: string
  end_time: string
  max_work_hours: number
  max_travel_hours: number
  min_break_hours: number
  checkout_time: string
  checkin_time: string
  home_address: string
  home_lat?: string
  home_lng?: string
}

export interface OptimizationInput {
  date: string
  jobs: CleaningJob[]
  workers: Worker[]
  settings: AppSettings
}

export interface OptimizationResult {
  steps: Omit<PlanStep, 'id' | 'daily_plan_id'>[]
  warnings: string[]
  totalJobsScheduled: number
  totalJobsSkipped: number
  carTrips: number
  skippedJobs: CleaningJob[]
}

export interface DailyStats {
  date: string
  totalJobs: number
  completedJobs: number
  totalDurationMin: number
  jobsByPriority: Record<Priority, number>
}
