// ─── Rôles ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'cleaner'

// ─── Anciens types ────────────────────────────────────────────────────────────

export type Priority = 'critical' | 'very_urgent' | 'urgent' | 'plannable' | 'flexible'
export type DirtinessLevel = 'clean' | 'normal' | 'dirty'
export type Platform = 'airbnb' | 'booking' | 'direct' | 'other'
export type ReservationStatus = 'pending' | 'confirmed' | 'cleaning_needed' | 'cleaned' | 'cancelled'
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type PlanStatus = 'draft' | 'validated' | 'in_progress' | 'completed'
export type StepType = 'travel' | 'cleaning' | 'break' | 'pickup' | 'dropoff'
export type AlertType = 'conflict' | 'missing_cleaning' | 'overlap' | 'tight_window'
export type AlertSeverity = 'error' | 'warning' | 'info'

// ─── Nouveaux types ───────────────────────────────────────────────────────────

export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'problem'
export type TaskType = 'simple' | 'photo' | 'video' | 'control' | 'optional'
export type RoomType =
  | 'entrance' | 'bedroom' | 'bathroom' | 'wc'
  | 'kitchen' | 'living' | 'balcony' | 'terrace'
  | 'laundry' | 'garage' | 'other'
export type AnomalyUrgency = 'low' | 'medium' | 'urgent'

export interface Room {
  id: string
  property_id: string
  name: string
  room_type: RoomType
  order_index: number
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string | null
  task_type: TaskType
  is_mandatory: boolean
  photo_required: boolean
  can_skip: boolean
  video_url?: string | null
  reference_photo_url?: string | null
  created_at: string
}

export interface WorkflowStep {
  id: string
  workflow_id: string
  task_id: string
  task?: Task
  room_id: string
  room?: Room
  order_index: number
  is_mandatory: boolean
  requires_photo?: boolean
}

export interface WorkflowRoomFinalPhoto {
  id: string
  workflow_id: string
  room_id: string
  label: string
  reference_photo_url: string
  order_index: number
  created_at: string
  isNew?: boolean
}

export interface MissionRoomFinalPhoto {
  id: string
  mission_id: string
  room_id: string
  final_photo_id?: string | null
  url: string
  taken_at: string
}

export interface MissionRoomProgress {
  id: string
  mission_id: string
  room_id: string
  tasks_completed: boolean
  photos_completed: boolean
  completed_at?: string | null
}

export interface Workflow {
  id: string
  name: string
  property_id?: string | null
  property?: Property
  is_active: boolean
  steps?: WorkflowStep[]
  room_final_photos?: WorkflowRoomFinalPhoto[]
  created_at: string
}

export interface Property {
  id: string
  name: string
  address?: string | null
  lat?: number | null
  lng?: number | null
  surface_m2?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  base_cleaning_duration_min?: number | null
  notes?: string | null
  property_type?: 'apartment' | 'house' | null
  apartment_type?: string | null
  building_code?: string | null
  door_code?: string | null
  key_box?: string | null
  key_instructions?: string | null
  linen_location?: string | null
  dirty_linen_location?: string | null
  products_location?: string | null
  trash_location?: string | null
  rooms?: Room[]
  workflows?: Workflow[]
  created_at: string
  updated_at: string
}

export interface MissionStep {
  id: string
  mission_id: string
  task_id: string
  task?: Task
  room_id: string
  room?: Room
  status: 'pending' | 'completed' | 'skipped'
  is_mandatory: boolean
  skip_reason?: string | null
  comment?: string | null
  order_index: number
}

export interface Anomaly {
  id: string
  mission_id: string
  anomaly_type: string
  urgency: AnomalyUrgency
  is_blocking: boolean
  comment?: string | null
  room?: Room
  created_at: string
}

export interface MissionPhoto {
  id: string
  mission_id: string
  step_id?: string | null
  url: string
  created_at: string
}

export interface MissionReport {
  id: string
  mission_id: string
  final_status: 'ready' | 'ready_with_note' | 'not_ready'
  duration_min?: number | null
  steps_total: number
  steps_completed: number
  anomalies_count: number
}

export interface Mission {
  id: string
  property_id: string
  property?: Property
  workflow_id?: string | null
  workflow?: { id: string; name: string; room_final_photos?: WorkflowRoomFinalPhoto[] } | null
  status: MissionStatus
  scheduled_date: string
  scheduled_time?: string | null
  checkin_time?: string | null
  time_tracking_mode: 'none' | 'start_end'
  notes?: string | null
  steps?: MissionStep[]
  room_progress?: MissionRoomProgress[]
  anomalies?: Anomaly[]
  photos?: MissionPhoto[]
  report?: MissionReport
  created_at: string
  updated_at: string
}

// ─── Types compatibilité ──────────────────────────────────────────────────────

export interface Worker {
  id: string
  name: string
  color: string
  is_active: boolean
  created_at: string
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
}

// ─── Types optimizer (compatibilité) ─────────────────────────────────────────

export interface OptimizationInput {
  jobs: CleaningJob[]
  workers: Worker[]
  settings: AppSettings
  date: string
}

export interface OptimizationResult {
  steps: Omit<PlanStep, 'id' | 'daily_plan_id'>[]
  totalDuration?: number
  carTrips: number
  warnings?: string[]
  totalJobsScheduled?: number
  totalJobsSkipped?: number
  skippedJobs?: CleaningJob[]
}
