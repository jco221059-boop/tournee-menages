import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type {
  Property,
  Reservation,
  CleaningJob,
  Worker,
  DailyPlan,
  PlanStep,
  Alert,
  AppSettings,
} from '../types'

interface AppState {
  // Data
  properties: Property[]
  reservations: Reservation[]
  cleaningJobs: CleaningJob[]
  workers: Worker[]
  dailyPlans: DailyPlan[]
  planSteps: PlanStep[]
  alerts: Alert[]
  settings: AppSettings

  // UI
  loading: boolean
  error: string | null

  // Property actions
  fetchProperties: () => Promise<void>
  addProperty: (p: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => Promise<Property>
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>
  deleteProperty: (id: string) => Promise<void>

  // Reservation actions
  fetchReservations: () => Promise<void>
  addReservation: (r: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'property'>) => Promise<Reservation>
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>
  deleteReservation: (id: string) => Promise<void>

  // Cleaning job actions
  fetchCleaningJobs: (date?: string) => Promise<void>
  addCleaningJob: (j: Omit<CleaningJob, 'id' | 'created_at' | 'updated_at' | 'property' | 'reservation' | 'worker'>) => Promise<CleaningJob>
  updateCleaningJob: (id: string, updates: Partial<CleaningJob>) => Promise<void>
  deleteCleaningJob: (id: string) => Promise<void>

  // Worker actions
  fetchWorkers: () => Promise<void>
  updateWorker: (id: string, updates: Partial<Worker>) => Promise<void>

  // Daily plan actions
  fetchDailyPlan: (date: string) => Promise<{ plan: DailyPlan | null; steps: PlanStep[] }>
  saveDailyPlan: (
    date: string,
    steps: Omit<PlanStep, 'id' | 'daily_plan_id'>[],
    jobCount: number,
    carTrips: number
  ) => Promise<DailyPlan>
  updatePlanStatus: (planId: string, status: DailyPlan['status']) => Promise<void>

  // Alert actions
  fetchAlerts: () => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  clearResolvedAlerts: () => Promise<void>

  // Settings actions
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>

  setError: (error: string | null) => void
}

const defaultSettings: AppSettings = {
  start_time: '08:00',
  end_time: '18:00',
  max_work_hours: 6,
  max_travel_hours: 1,
  min_break_hours: 1,
  checkout_time: '11:00',
  checkin_time: '15:00',
  home_address: '',
}

export const useAppStore = create<AppState>((set, get) => ({
  properties: [],
  reservations: [],
  cleaningJobs: [],
  workers: [],
  dailyPlans: [],
  planSteps: [],
  alerts: [],
  settings: defaultSettings,
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  // ─── Properties ─────────────────────────────────────────

  fetchProperties: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('name')
    if (error) { set({ error: error.message, loading: false }); return }
    set({ properties: data as Property[], loading: false })
  },

  addProperty: async (p) => {
    const { data, error } = await supabase
      .from('properties')
      .insert(p)
      .select()
      .single()
    if (error) throw new Error(error.message)
    const prop = data as Property
    set((s) => ({ properties: [...s.properties, prop] }))
    return prop
  },

  updateProperty: async (id, updates) => {
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      properties: s.properties.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },

  deleteProperty: async (id) => {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ properties: s.properties.filter((p) => p.id !== id) }))
  },

  // ─── Reservations ───────────────────────────────────────

  fetchReservations: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('reservations')
      .select('*, property:properties(*)')
      .order('check_in', { ascending: false })
    if (error) { set({ error: error.message, loading: false }); return }
    set({ reservations: data as Reservation[], loading: false })
  },

  addReservation: async (r) => {
    const { data, error } = await supabase
      .from('reservations')
      .insert(r)
      .select('*, property:properties(*)')
      .single()
    if (error) throw new Error(error.message)
    const res = data as Reservation
    set((s) => ({ reservations: [res, ...s.reservations] }))
    return res
  },

  updateReservation: async (id, updates) => {
    const { error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  },

  deleteReservation: async (id) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ reservations: s.reservations.filter((r) => r.id !== id) }))
  },

  // ─── Cleaning Jobs ───────────────────────────────────────

  fetchCleaningJobs: async (date) => {
    set({ loading: true })
    let query = supabase
      .from('cleaning_jobs')
      .select('*, property:properties(*), worker:workers(*), reservation:reservations(*)')
    if (date) query = query.eq('scheduled_date', date)
    query = query.order('scheduled_date', { ascending: true })
    const { data, error } = await query
    if (error) { set({ error: error.message, loading: false }); return }
    set({ cleaningJobs: data as CleaningJob[], loading: false })
  },

  addCleaningJob: async (j) => {
    const { data, error } = await supabase
      .from('cleaning_jobs')
      .insert(j)
      .select('*, property:properties(*), worker:workers(*)')
      .single()
    if (error) throw new Error(error.message)
    const job = data as CleaningJob
    set((s) => ({ cleaningJobs: [...s.cleaningJobs, job] }))
    return job
  },

  updateCleaningJob: async (id, updates) => {
    const { error } = await supabase
      .from('cleaning_jobs')
      .update(updates)
      .eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      cleaningJobs: s.cleaningJobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    }))
  },

  deleteCleaningJob: async (id) => {
    const { error } = await supabase.from('cleaning_jobs').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ cleaningJobs: s.cleaningJobs.filter((j) => j.id !== id) }))
  },

  // ─── Workers ─────────────────────────────────────────────

  fetchWorkers: async () => {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) { set({ error: error.message }); return }
    set({ workers: data as Worker[] })
  },

  updateWorker: async (id, updates) => {
    const { error } = await supabase.from('workers').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      workers: s.workers.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }))
  },

  // ─── Daily Plan ──────────────────────────────────────────

  fetchDailyPlan: async (date) => {
    const { data: plan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (!plan) return { plan: null, steps: [] }

    const { data: steps } = await supabase
      .from('plan_steps')
      .select('*, worker:workers(*), cleaning_job:cleaning_jobs(*, property:properties(*))')
      .eq('daily_plan_id', plan.id)
      .order('order_index')

    const typedSteps = (steps ?? []) as PlanStep[]
    set({ planSteps: typedSteps })
    return { plan: plan as DailyPlan, steps: typedSteps }
  },

  saveDailyPlan: async (date, steps, jobCount, carTrips) => {
    // Upsert le plan
    const { data: existing } = await supabase
      .from('daily_plans')
      .select('id')
      .eq('date', date)
      .maybeSingle()

    let planId: string
    if (existing) {
      planId = existing.id
      await supabase
        .from('daily_plans')
        .update({ total_jobs: jobCount, car_trips: carTrips, status: 'draft' })
        .eq('id', planId)
      await supabase.from('plan_steps').delete().eq('daily_plan_id', planId)
    } else {
      const { data: newPlan, error } = await supabase
        .from('daily_plans')
        .insert({ date, total_jobs: jobCount, car_trips: carTrips, status: 'draft' })
        .select()
        .single()
      if (error) throw new Error(error.message)
      planId = newPlan.id
    }

    // Insérer les étapes
    if (steps.length > 0) {
      const stepsWithPlanId = steps.map((s, i) => ({
        ...s,
        daily_plan_id: planId,
        order_index: i,
      }))
      const { error } = await supabase.from('plan_steps').insert(stepsWithPlanId)
      if (error) throw new Error(error.message)
    }

    const { data: savedPlan } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('id', planId)
      .single()

    return savedPlan as DailyPlan
  },

  updatePlanStatus: async (planId, status) => {
    await supabase.from('daily_plans').update({ status }).eq('id', planId)
  },

  // ─── Alerts ──────────────────────────────────────────────

  fetchAlerts: async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    if (error) { set({ error: error.message }); return }
    set({ alerts: data as Alert[] })
  },

  resolveAlert: async (id) => {
    await supabase.from('alerts').update({ resolved: true }).eq('id', id)
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }))
  },

  clearResolvedAlerts: async () => {
    await supabase.from('alerts').delete().eq('resolved', true)
  },

  // ─── Settings ────────────────────────────────────────────

  fetchSettings: async () => {
    const { data, error } = await supabase.from('app_settings').select('*')
    if (error || !data) return
    const settings: Partial<AppSettings> = {}
    for (const row of data) {
      switch (row.key) {
        case 'start_time': settings.start_time = row.value; break
        case 'end_time': settings.end_time = row.value; break
        case 'max_work_hours': settings.max_work_hours = Number(row.value); break
        case 'max_travel_hours': settings.max_travel_hours = Number(row.value); break
        case 'min_break_hours': settings.min_break_hours = Number(row.value); break
        case 'checkout_time': settings.checkout_time = row.value; break
        case 'checkin_time': settings.checkin_time = row.value; break
        case 'home_address': settings.home_address = row.value; break
      }
    }
    set({ settings: { ...defaultSettings, ...settings } })
  },

  updateSettings: async (updates) => {
    const rows = Object.entries(updates).map(([key, value]) => ({
      key,
      value: String(value),
    }))
    for (const row of rows) {
      await supabase
        .from('app_settings')
        .upsert({ key: row.key, value: row.value, updated_at: new Date().toISOString() })
    }
    set((s) => ({ settings: { ...s.settings, ...updates } }))
  },
}))
