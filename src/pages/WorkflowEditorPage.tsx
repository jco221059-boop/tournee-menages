import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, GripVertical, AlertTriangle, Camera } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Spinner, Toast, useToast } from '../components/ui'
import { supabase } from '../lib/supabase'
import { ROOM_CONFIG, type RoomType } from './PremiumGestures'
import type { WorkflowRoomFinalPhoto, Task, WorkflowStep, Room } from '../types'

// ── Composant slot photo finale ───────────────────────────────────────────────

function FinalPhotoSlotRow({ slot, index, onLabelChange, onPhotoChange, onRemove }: {
  slot: WorkflowRoomFinalPhoto & { isNew?: boolean }
  index: number
  onLabelChange: (l: string) => void
  onPhotoChange: (url: string | null) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `workflow-finals/${slot.id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('mission-photos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('mission-photos').getPublicUrl(path)
      onPhotoChange(data.publicUrl)
    } catch (err) {
      console.error(err)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDeletePhoto = async () => {
    if (!slot.reference_photo_url) return
    const path = slot.reference_photo_url.split('/menageflow/')[1]
    if (path) await supabase.storage.from('mission-photos').remove([path])
    onPhotoChange(null)
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-2.5"
      style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid #F5F0EA' }}>
        <div className="cursor-grab flex-shrink-0" style={{ color: '#D5C4AF' }}>
          <GripVertical size={14} />
        </div>
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ background: '#0D9488', color: '#fff' }}>
          {index + 1}
        </div>
        <input
          type="text"
          value={slot.label}
          onChange={e => onLabelChange(e.target.value)}
          placeholder="Ex : Vue d'ensemble"
          className="flex-1 text-sm font-semibold outline-none"
          style={{ background: 'transparent', border: 'none', color: '#2C1F0E', fontFamily: 'inherit' }}
        />
        <button onClick={onRemove}
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#FEF2F2', color: '#DC2626', border: 'none' }}>
          <Trash2 size={11} />
        </button>
      </div>

      <div className="px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#C4A882' }}>
          Photo modèle
          <span className="ml-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: '#FEF3C7', color: '#78350F' }}>Obligatoire</span>
        </p>

        {slot.reference_photo_url ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid #0D9488' }}>
            <img src={slot.reference_photo_url} alt="Modèle" className="w-full object-cover" style={{ height: 100 }} />
            <div className="flex gap-2 p-2" style={{ background: '#fff', borderTop: '1px solid #EDE0D0' }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: '#EEF4EF', color: '#2C4A30', border: 'none', fontFamily: 'inherit' }}>
                {uploading ? <Spinner size={12} /> : '↺'} Changer
              </button>
              <button onClick={handleDeletePhoto}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', fontFamily: 'inherit' }}>
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer"
            style={{ background: '#FEF3C7', border: '1.5px dashed #D97706' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#FDE68A' }}>
              <AlertTriangle size={16} style={{ color: '#D97706' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: '#78350F' }}>Photo modèle manquante</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#D97706' }}>Obligatoire — bloque la sauvegarde</p>
            </div>
            {uploading ? <Spinner size={14} /> : (
              <button className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0"
                style={{ background: '#D97706', color: '#fff', border: 'none', fontFamily: 'inherit' }}>
                + Ajouter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function WorkflowEditorPage() {
  const { id: workflowId } = useParams()
  const navigate = useNavigate()
  const {
    workflows, properties, tasks,
    fetchWorkflows, fetchProperties, fetchTasks,
    addWorkflowStep, removeWorkflowStep,
    saveWorkflowFinalPhotos,
  } = useAppStore()

  const isNew = !workflowId || workflowId === 'new'
  const workflow = workflows.find(w => w.id === workflowId)
  const propertyRooms: Room[] = workflow?.property?.rooms ?? []
  const rooms = [...propertyRooms].sort((a, b) => a.order_index - b.order_index)

  const [openRooms, setOpenRooms] = useState<Set<string>>(new Set())
  const [finalPhotosByRoom, setFinalPhotosByRoom] = useState<Record<string, (WorkflowRoomFinalPhoto & { isNew?: boolean })[]>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [addTaskRoomId, setAddTaskRoomId] = useState<string | null>(null)
  const [taskSearch, setTaskSearch] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchProperties()
    fetchTasks()
    if (!isNew) fetchWorkflows()
  }, [])

  useEffect(() => {
    if (workflow) {
      const byRoom: Record<string, (WorkflowRoomFinalPhoto & { isNew?: boolean })[]> = {}
      ;(workflow.room_final_photos ?? []).forEach((p) => {
        if (!byRoom[p.room_id]) byRoom[p.room_id] = []
        byRoom[p.room_id].push(p)
      })
      setFinalPhotosByRoom(byRoom)
      if (rooms[0]) setOpenRooms(new Set([rooms[0].id]))
    }
  }, [workflow?.id])

  const toggleRoom = (id: string) => setOpenRooms(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const validate = (): string | null => {
    for (const room of rooms) {
      const slots = finalPhotosByRoom[room.id] ?? []
      if (slots.length === 0)
        return `${ROOM_CONFIG[room.room_type as RoomType]?.label ?? room.name} : au moins 1 photo finale requise.`
      const missing = slots.find(s => !s.reference_photo_url)
      if (missing)
        return `${ROOM_CONFIG[room.room_type as RoomType]?.label ?? room.name} — "${missing.label || 'slot'}" : photo modèle obligatoire manquante.`
    }
    return null
  }

  const handleSave = async () => {
    const error = validate()
    if (error) { setSaveError(error); return }
    setSaveError(null)
    setSaving(true)
    await saveWorkflowFinalPhotos?.(workflowId!, finalPhotosByRoom)
    setSaving(false)
    toast.trigger()
  }

  const addSlot = (roomId: string) => setFinalPhotosByRoom(prev => ({
    ...prev,
    [roomId]: [
      ...(prev[roomId] ?? []),
      {
        id: `tmp-${Date.now()}`,
        workflow_id: workflowId!,
        room_id: roomId,
        label: '',
        reference_photo_url: '',
        order_index: prev[roomId]?.length ?? 0,
        created_at: new Date().toISOString(),
        isNew: true,
      },
    ],
  }))

  const updateSlot = (roomId: string, slotId: string, changes: Partial<WorkflowRoomFinalPhoto>) =>
    setFinalPhotosByRoom(prev => ({
      ...prev,
      [roomId]: (prev[roomId] ?? []).map(s => s.id === slotId ? { ...s, ...changes } : s),
    }))

  const removeSlot = (roomId: string, slotId: string) =>
    setFinalPhotosByRoom(prev => ({
      ...prev,
      [roomId]: (prev[roomId] ?? []).filter(s => s.id !== slotId),
    }))

  const handleAddTask = async (task: Task) => {
    if (!addTaskRoomId || !workflowId) return
    await addWorkflowStep(workflowId, {
      room_id: addTaskRoomId,
      task_id: task.id,
      is_mandatory: true,
      order_index: (workflow?.steps?.filter(s => s.room_id === addTaskRoomId).length ?? 0),
    })
    setShowAddTask(false)
    setTaskSearch('')
  }

  const handleRemoveStep = async (stepId: string) => {
    await removeWorkflowStep(stepId)
  }

  if (isNew) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center"
        style={{ background: '#FAF7F2' }}>
        <div className="text-5xl">⚙️</div>
        <p className="text-sm font-semibold" style={{ color: '#A8937A' }}>
          Pour configurer les photos finales, ouvrez un workflow existant depuis la page Workflows.
        </p>
        <button onClick={() => navigate(-1)}
          className="text-white text-sm font-bold px-5 py-2.5 rounded-full"
          style={{ background: '#6B9E78' }}>
          Retour
        </button>
      </div>
    )
  }

  const roomTaskIds = addTaskRoomId
    ? new Set((workflow?.steps ?? []).filter(s => s.room_id === addTaskRoomId).map(s => s.task_id))
    : new Set<string>()
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()))

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #EDE0D0' }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            {workflow?.name ?? 'Workflow'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{rooms.length} pièce{rooms.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-full"
          style={{ background: '#6B9E78' }}>
          {saving ? <Spinner size={14} /> : <Save size={14} />} Sauver
        </button>
      </div>

      {/* Erreur validation */}
      {saveError && (
        <div className="mx-5 mt-3 flex items-start gap-2.5 px-4 py-3 rounded-2xl flex-shrink-0"
          style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <AlertTriangle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs font-semibold" style={{ color: '#78350F' }}>{saveError}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Pièces</p>

        {rooms.map((room) => {
          const cfg = ROOM_CONFIG[room.room_type as RoomType]
          const isOpen = openRooms.has(room.id)
          const steps = (workflow?.steps ?? [])
            .filter((s: WorkflowStep) => s.room_id === room.id)
            .sort((a: WorkflowStep, b: WorkflowStep) => a.order_index - b.order_index)
          const finalSlots = finalPhotosByRoom[room.id] ?? []
          const hasMissing = finalSlots.length === 0 || finalSlots.some(s => !s.reference_photo_url)

          return (
            <div key={room.id} className="mb-4">
              {/* Accordion header */}
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                style={{
                  background: '#fff',
                  border: '1px solid #EDE0D0',
                  borderRadius: isOpen ? '18px 18px 0 0' : '18px',
                  borderBottom: isOpen ? '1px solid #F5F0EA' : '1px solid #EDE0D0',
                }}
                onClick={() => toggleRoom(room.id)}
              >
                <span style={{ fontSize: 18 }}>{cfg?.emoji ?? '📦'}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#2C1F0E' }}>{cfg?.label ?? room.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                    {steps.length} tâche{steps.length !== 1 ? 's' : ''}
                    {' · '}
                    {finalSlots.length} photo{finalSlots.length !== 1 ? 's' : ''} finale{finalSlots.length !== 1 ? 's' : ''}
                    {hasMissing && <span className="ml-1.5 font-bold" style={{ color: '#D97706' }}>⚠</span>}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ color: '#D5C4AF', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {isOpen && (
                <div style={{ background: '#fff', border: '1px solid #EDE0D0', borderTop: 'none', borderRadius: '0 0 18px 18px' }}>

                  {/* Tâches du carrousel */}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#C4A882' }}>
                      Tâches du carrousel
                    </p>
                    {steps.map((step: WorkflowStep, si: number) => (
                      <div key={step.id} className="flex items-center gap-2.5 py-2.5"
                        style={{ borderBottom: si < steps.length - 1 ? '1px solid #F5F0EA' : 'none' }}>
                        <div className="cursor-grab flex-shrink-0" style={{ color: '#D5C4AF' }}>
                          <GripVertical size={14} />
                        </div>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ background: '#F5F0EA', color: '#A8937A' }}>
                          {si + 1}
                        </div>
                        <p className="text-xs font-medium flex-1" style={{ color: '#2C1F0E' }}>
                          {step.task?.title}
                        </p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: step.requires_photo || step.task?.photo_required ? '#CCFBF1' : '#F5F0EA',
                            color: step.requires_photo || step.task?.photo_required ? '#0F766E' : '#A8937A',
                          }}>
                          {step.requires_photo || step.task?.photo_required ? '📷 Photo' : '✓ Fait'}
                        </span>
                        <button onClick={() => handleRemoveStep(step.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: '#FEF2F2', color: '#DC2626', border: 'none' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => { setAddTaskRoomId(room.id); setShowAddTask(true) }}
                      className="flex items-center gap-2 text-xs font-semibold py-2.5 w-full"
                      style={{
                        color: '#6B9E78', background: 'none', border: 'none',
                        fontFamily: 'inherit', cursor: 'pointer',
                        borderTop: steps.length > 0 ? '1px solid #F5F0EA' : 'none',
                      }}>
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                        style={{ background: '#EEF4EF', border: '1.5px dashed #B5D4BA' }}>
                        <Plus size={11} />
                      </div>
                      Ajouter une tâche
                    </button>
                  </div>

                  {/* Séparateur */}
                  <div style={{ height: 2, background: '#EDE0D0', margin: '0 16px' }} />

                  {/* Photos finales */}
                  <div className="px-4 pt-3 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                        style={{ background: '#0D9488', color: '#fff' }}>
                        <Camera size={12} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold" style={{ color: '#0D9488' }}>Photos finales de la pièce</p>
                        <p className="text-[9px] mt-0.5" style={{ color: '#0D9488', opacity: 0.7 }}>
                          Photo modèle obligatoire sur chaque slot
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#CCFBF1', color: '#0F766E', border: '1px solid #99F6E4' }}>
                        {finalSlots.length} slot{finalSlots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {finalSlots.map((slot, si) => (
                      <FinalPhotoSlotRow
                        key={slot.id}
                        slot={slot}
                        index={si}
                        onLabelChange={l => updateSlot(room.id, slot.id, { label: l })}
                        onPhotoChange={url => updateSlot(room.id, slot.id, { reference_photo_url: url ?? '' })}
                        onRemove={() => removeSlot(room.id, slot.id)}
                      />
                    ))}

                    <button onClick={() => addSlot(room.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-semibold"
                      style={{ background: 'transparent', border: '1.5px dashed #99F6E4', color: '#0D9488', fontFamily: 'inherit' }}>
                      <Plus size={13} /> Ajouter une photo finale
                    </button>
                  </div>

                </div>
              )}
            </div>
          )
        })}

        {rooms.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center gap-3">
            <div className="text-4xl">🏠</div>
            <p className="text-sm font-semibold" style={{ color: '#A8937A' }}>
              Ce logement n'a pas encore de pièces.
            </p>
            {workflow?.property_id && (
              <button onClick={() => navigate(`/config/properties/${workflow.property_id}`)}
                className="text-white text-sm font-bold px-5 py-2.5 rounded-full"
                style={{ background: '#6B9E78' }}>
                Configurer les pièces
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sheet ajouter tâche */}
      {showAddTask && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowAddTask(false)}
        >
          <div
            className="rounded-t-3xl px-5 pt-5 pb-8"
            style={{ background: '#FAF7F2', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold" style={{ color: '#2C1F0E' }}>Ajouter une tâche</p>
              <button onClick={() => setShowAddTask(false)} className="text-sm font-semibold"
                style={{ color: '#A8937A', background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
            <input
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-3"
              style={{ background: '#F5F0EA', border: '1px solid #EDE0D0', color: '#2C1F0E', fontFamily: 'inherit' }}
            />
            <div className="overflow-y-auto flex-1">
              {filteredTasks.map(task => {
                const already = roomTaskIds.has(task.id)
                return (
                  <button
                    key={task.id}
                    onClick={() => !already && handleAddTask(task)}
                    disabled={already}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left"
                    style={{ background: already ? '#F5F0EA' : 'transparent', opacity: already ? 0.5 : 1, cursor: already ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: task.photo_required ? '#CCFBF1' : '#F5F0EA', color: task.photo_required ? '#0D9488' : '#A8937A' }}>
                      <Camera size={15} />
                    </div>
                    <p className="text-sm font-medium flex-1 truncate" style={{ color: '#2C1F0E' }}>
                      {task.title}
                    </p>
                    {already && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#EEF4EF', color: '#6B9E78' }}>Ajoutée</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <Toast show={toast.show} message="Workflow enregistré ✓" variant="success" />
    </div>
  )
}
