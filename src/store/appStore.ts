import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type {
  Property, Worker, Alert, AppSettings,
  Mission, Task, Workflow, WorkflowStep, Room,
  MissionStep, Anomaly,
} from '../types'

interface AppState {
  // ── Données ──────────────────────────────────────────────
  properties: Property[]
  tasks: Task[]
  workflows: Workflow[]
  missions: Mission[]
  workers: Worker[]
  alerts: Alert[]
  settings: AppSettings

  loading: boolean
  error: string | null

  // ── Propriétés ───────────────────────────────────────────
  fetchProperties: () => Promise<void>
  addProperty: (p: Partial<Property>) => Promise<Property>
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>
  deleteProperty: (id: string) => Promise<void>
  addRoom: (propertyId: string, room: Omit<Room, 'id' | 'created_at'>) => Promise<Room>
  deleteRoom: (roomId: string) => Promise<void>
  reorderRooms: (propertyId: string, roomIds: string[]) => Promise<void>

  // ── Tâches ───────────────────────────────────────────────
  fetchTasks: () => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // ── Workflows ────────────────────────────────────────────
  fetchWorkflows: (propertyId?: string) => Promise<void>
  createWorkflow: (data: Partial<Workflow>) => Promise<Workflow>
  updateWorkflow: (id: string, updates: Partial<Workflow> & { steps?: WorkflowStep[] }) => Promise<void>
  deleteWorkflow: (id: string) => Promise<void>
  addWorkflowStep: (workflowId: string, step: Partial<WorkflowStep>) => Promise<WorkflowStep>
  removeWorkflowStep: (stepId: string) => Promise<void>
  reorderWorkflowSteps: (workflowId: string, stepIds: string[]) => Promise<void>
  autoGenerateWorkflow: (workflowId: string) => Promise<WorkflowStep[] | null>
  completeAutoWorkflow: (workflowId: string) => Promise<void>
  createDefaultWorkflow: (propertyId: string) => Promise<Workflow | null>

  // ── Missions ─────────────────────────────────────────────
  fetchMissions: () => Promise<void>
  fetchMission: (id: string) => Promise<void>
  getMission: (id: string) => Mission | undefined
  createMission: (data: Partial<Mission>) => Promise<Mission>
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>
  startMission: (id: string) => Promise<void>
  completeMission: (id: string, data: { final_status: string }) => Promise<void>
  completeStep: (stepId: string) => Promise<void>
  skipStep: (stepId: string, reason: string) => Promise<void>
  addStepNote: (stepId: string, note: string) => Promise<void>
  takeStepPhoto: (stepId: string) => Promise<void>
  reorderMissionRooms: (missionId: string, roomIds: string[]) => Promise<void>
  createAnomaly: (data: Partial<Anomaly>) => Promise<void>

  // ── Alertes ──────────────────────────────────────────────
  fetchAlerts: () => Promise<void>
  resolveAlert: (id: string) => Promise<void>

  // ── Paramètres ───────────────────────────────────────────
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
  tasks: [],
  workflows: [],
  missions: [],
  workers: [],
  alerts: [],
  settings: defaultSettings,
  loading: false,
  error: null,

  setError: (error) => set({ error }),

  // ─── Propriétés ──────────────────────────────────────────────────────────

  fetchProperties: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('properties')
      .select('*, rooms(*), workflows(id, name, is_active)')
      .order('name')
    if (error) { set({ loading: false }); return }
    set({ properties: (data ?? []) as Property[], loading: false })
  },

  addProperty: async (p) => {
    const { data, error } = await supabase
      .from('properties')
      .insert(p)
      .select('*, rooms(*)')
      .single()
    if (error) throw new Error(error.message)
    const prop = data as Property
    set((s) => ({ properties: [...s.properties, prop] }))
    return prop
  },

  updateProperty: async (id, updates) => {
    const { error } = await supabase.from('properties').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      properties: s.properties.map((p) => p.id === id ? { ...p, ...updates } : p),
    }))
  },

  deleteProperty: async (id) => {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ properties: s.properties.filter((p) => p.id !== id) }))
  },

  addRoom: async (propertyId, room) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert({ ...room, property_id: propertyId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    const r = data as Room
    set((s) => ({
      properties: s.properties.map((p) =>
        p.id === propertyId ? { ...p, rooms: [...(p.rooms ?? []), r] } : p
      ),
    }))
    return r
  },

  deleteRoom: async (roomId) => {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) throw new Error(error.message)
    set((s) => ({
      properties: s.properties.map((p) => ({
        ...p,
        rooms: p.rooms?.filter((r) => r.id !== roomId) ?? [],
      })),
    }))
  },

  reorderRooms: async (propertyId, roomIds) => {
    for (let i = 0; i < roomIds.length; i++) {
      await supabase.from('rooms').update({ order_index: i }).eq('id', roomIds[i])
    }
    set((s) => ({
      properties: s.properties.map((p) => {
        if (p.id !== propertyId) return p
        const sorted = [...(p.rooms ?? [])].sort(
          (a, b) => roomIds.indexOf(a.id) - roomIds.indexOf(b.id)
        )
        return { ...p, rooms: sorted }
      }),
    }))
  },

  // ─── Tâches ──────────────────────────────────────────────────────────────

  fetchTasks: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('title')
    if (error) { set({ loading: false }); return }
    set({ tasks: (data ?? []) as Task[], loading: false })
  },

  createTask: async (data) => {
    const { data: row, error } = await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    const task = row as Task
    set((s) => ({ tasks: [...s.tasks, task] }))
    return task
  },

  updateTask: async (id, updates) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
    }))
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  // ─── Workflows ───────────────────────────────────────────────────────────

  fetchWorkflows: async (propertyId) => {
    set({ loading: true })
    let query = supabase
      .from('workflows')
      .select('*, property:properties(id, name, address), steps:workflow_steps(*, task:tasks(*), room:rooms(*))')
      .order('name')
    if (propertyId) query = query.eq('property_id', propertyId)
    const { data, error } = await query
    if (error) { set({ loading: false }); return }
    set({ workflows: (data ?? []) as Workflow[], loading: false })
  },

  createWorkflow: async (data) => {
    const { data: row, error } = await supabase
      .from('workflows')
      .insert(data)
      .select('*, property:properties(id, name, address)')
      .single()
    if (error) throw new Error(error.message)
    const wf = row as Workflow
    set((s) => ({ workflows: [...s.workflows, wf] }))
    return wf
  },

  updateWorkflow: async (id, updates) => {
    const { steps, ...wfUpdates } = updates
    const { error } = await supabase.from('workflows').update(wfUpdates).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      workflows: s.workflows.map((w) => w.id === id ? { ...w, ...updates } : w),
    }))
  },

  deleteWorkflow: async (id) => {
    const { error } = await supabase.from('workflows').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }))
  },

  addWorkflowStep: async (workflowId, step) => {
    const { data, error } = await supabase
      .from('workflow_steps')
      .insert({ ...step, workflow_id: workflowId })
      .select('*, task:tasks(*), room:rooms(*)')
      .single()
    if (error) throw new Error(error.message)
    const s = data as WorkflowStep
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId ? { ...w, steps: [...(w.steps ?? []), s] } : w
      ),
    }))
    return s
  },

  removeWorkflowStep: async (stepId) => {
    const { error } = await supabase.from('workflow_steps').delete().eq('id', stepId)
    if (error) throw new Error(error.message)
    set((state) => ({
      workflows: state.workflows.map((w) => ({
        ...w,
        steps: w.steps?.filter((s) => s.id !== stepId) ?? [],
      })),
    }))
  },

  reorderWorkflowSteps: async (workflowId, stepIds) => {
    for (let i = 0; i < stepIds.length; i++) {
      await supabase.from('workflow_steps').update({ order_index: i }).eq('id', stepIds[i])
    }
  },

  autoGenerateWorkflow: async (workflowId) => {
    // Génère automatiquement les étapes selon les pièces du logement
    const wf = get().workflows.find((w) => w.id === workflowId)
    if (!wf?.property_id) return null
    // TODO: logique auto-génération côté serveur ou locale
    return wf.steps ?? []
  },

  completeAutoWorkflow: async (workflowId) => {
    await supabase.from('workflows').update({ is_active: true }).eq('id', workflowId)
    set((s) => ({
      workflows: s.workflows.map((w) =>
        w.id === workflowId ? { ...w, is_active: true } : w
      ),
    }))
  },

  createDefaultWorkflow: async (propertyId) => {
    try {
      const prop = get().properties.find((p) => p.id === propertyId)
      const name = `Workflow ${prop?.name ?? 'standard'}`
      const { data, error } = await supabase
        .from('workflows')
        .insert({ name, property_id: propertyId, is_active: true })
        .select('*, property:properties(id, name, address)')
        .single()
      if (error) return null
      const wf = data as Workflow
      set((s) => ({ workflows: [...s.workflows, wf] }))
      return wf
    } catch {
      return null
    }
  },

  // ─── Missions ────────────────────────────────────────────────────────────

  fetchMissions: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        property:properties(id, name, address, building_code, door_code, key_box, key_instructions, linen_location, dirty_linen_location, products_location, trash_location, notes),
        steps:mission_steps(*, task:tasks(*), room:rooms(*)),
        anomalies:anomalies(*),
        photos:mission_photos(*),
        report:mission_reports(*)
      `)
      .order('scheduled_date')
    if (error) { set({ loading: false }); return }
    set({ missions: (data ?? []) as Mission[], loading: false })
  },

  fetchMission: async (id) => {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        property:properties(id, name, address, building_code, door_code, key_box, key_instructions, linen_location, dirty_linen_location, products_location, trash_location, notes),
        steps:mission_steps(*, task:tasks(*), room:rooms(*)),
        anomalies:anomalies(*),
        photos:mission_photos(*),
        report:mission_reports(*)
      `)
      .eq('id', id)
      .single()
    if (error) return
    const mission = data as Mission
    set((s) => ({
      missions: s.missions.some((m) => m.id === id)
        ? s.missions.map((m) => m.id === id ? mission : m)
        : [...s.missions, mission],
    }))
  },

  getMission: (id) => get().missions.find((m) => m.id === id),

  createMission: async (data) => {
    const { data: row, error } = await supabase
      .from('missions')
      .insert(data)
      .select(`*, property:properties(id, name, address)`)
      .single()
    if (error) throw new Error(error.message)
    const mission = row as Mission
    set((s) => ({ missions: [mission, ...s.missions] }))
    return mission
  },

  updateMission: async (id, updates) => {
    const { error } = await supabase.from('missions').update(updates).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      missions: s.missions.map((m) => m.id === id ? { ...m, ...updates } : m),
    }))
  },

  deleteMission: async (id) => {
    const { error } = await supabase.from('missions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ missions: s.missions.filter((m) => m.id !== id) }))
  },

  startMission: async (id) => {
    await supabase.from('missions').update({ status: 'in_progress' }).eq('id', id)
    set((s) => ({
      missions: s.missions.map((m) =>
        m.id === id ? { ...m, status: 'in_progress' } : m
      ),
    }))
  },

  completeMission: async (id, { final_status }) => {
    await supabase.from('missions').update({ status: 'completed' }).eq('id', id)
    // Créer le rapport
    const mission = get().missions.find((m) => m.id === id)
    const steps = mission?.steps ?? []
    await supabase.from('mission_reports').insert({
      mission_id: id,
      final_status,
      steps_total: steps.length,
      steps_completed: steps.filter((s) => s.status === 'completed').length,
      anomalies_count: mission?.anomalies?.length ?? 0,
    })
    await get().fetchMission(id)
  },

  completeStep: async (stepId) => {
    await supabase
      .from('mission_steps')
      .update({ status: 'completed' })
      .eq('id', stepId)
    set((s) => ({
      missions: s.missions.map((m) => ({
        ...m,
        steps: m.steps?.map((step) =>
          step.id === stepId ? { ...step, status: 'completed' } : step
        ),
      })),
    }))
  },

  skipStep: async (stepId, reason) => {
    await supabase
      .from('mission_steps')
      .update({ status: 'skipped', skip_reason: reason })
      .eq('id', stepId)
    set((s) => ({
      missions: s.missions.map((m) => ({
        ...m,
        steps: m.steps?.map((step) =>
          step.id === stepId
            ? { ...step, status: 'skipped', skip_reason: reason }
            : step
        ),
      })),
    }))
  },

  addStepNote: async (stepId, note) => {
    await supabase.from('mission_steps').update({ comment: note }).eq('id', stepId)
    set((s) => ({
      missions: s.missions.map((m) => ({
        ...m,
        steps: m.steps?.map((step) =>
          step.id === stepId ? { ...step, comment: note } : step
        ),
      })),
    }))
  },

  takeStepPhoto: async (_stepId) => {
    // TODO: ouvrir caméra native via file input
  },

  reorderMissionRooms: async (_missionId, _roomIds) => {
    // TODO: réordre des étapes selon l'ordre des pièces
  },

  createAnomaly: async (data) => {
    const { error } = await supabase.from('anomalies').insert(data)
    if (error) throw new Error(error.message)
    if (data.mission_id) {
      await get().fetchMission(data.mission_id)
    }
  },

  // ─── Alertes ─────────────────────────────────────────────────────────────

  fetchAlerts: async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    if (error) return
    set({ alerts: (data ?? []) as Alert[] })
  },

  resolveAlert: async (id) => {
    await supabase.from('alerts').update({ resolved: true }).eq('id', id)
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }))
  },

  // ─── Paramètres ──────────────────────────────────────────────────────────

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
