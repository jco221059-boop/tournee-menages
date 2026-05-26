// PAGE: WorkflowEditorPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, accordion par pièce ouvert/fermé.
// Champ nom + select logement inline. Bandeau auto-génération teal.
// Poignée drag par tâche. Badge photo/vidéo. Bouton + Tâche dans chaque header.
// BottomSheet ajout de tâche avec liste filtrée. Bouton Sauver fixe en header.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Zap, Plus, Trash2,
  GripVertical, ChevronDown, ChevronUp,
  Camera, Play, CheckSquare
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { BottomSheet, Toggle, Spinner, Toast, useToast } from '../components/ui'
import type { WorkflowStep, Task, Room } from '../types'

export default function WorkflowEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    workflows, properties, tasks,
    fetchWorkflows, fetchProperties, fetchTasks,
    createWorkflow, updateWorkflow, addWorkflowStep,
    removeWorkflowStep, reorderWorkflowSteps,
    autoGenerateWorkflow, completeAutoWorkflow,
  } = useAppStore()

  const isNew = !id || id === 'new'
  const workflow = workflows.find(w => w.id === id)

  const [name, setName] = useState(workflow?.name ?? '')
  const [propertyId, setPropertyId] = useState(workflow?.property_id ?? '')
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.steps ?? [])
  const [openRooms, setOpenRooms] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [addTaskRoomId, setAddTaskRoomId] = useState<string | null>(null)
  const [taskSearch, setTaskSearch] = useState('')
  const [newStepMandatory, setNewStepMandatory] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchProperties()
    fetchTasks()
    if (!isNew) fetchWorkflows()
  }, [])

  useEffect(() => {
    if (workflow) {
      setName(workflow.name)
      setPropertyId(workflow.property_id ?? '')
      setSteps(workflow.steps ?? [])
      // Ouvre les 2 premières pièces
      const roomIds = [...new Set((workflow.steps ?? []).map(s => s.room_id))]
      setOpenRooms(new Set(roomIds.slice(0, 2)))
    }
  }, [workflow])

  const property = properties.find(p => p.id === propertyId)
  const rooms: Room[] = property?.rooms ?? []

  // Grouper les étapes par pièce
  const stepsByRoom = rooms.reduce((acc, room) => {
    acc[room.id] = steps.filter(s => s.room_id === room.id)
      .sort((a, b) => a.order_index - b.order_index)
    return acc
  }, {} as Record<string, WorkflowStep[]>)

  const totalSteps = steps.length
  const hasSteps = totalSteps > 0
  const hasRooms = rooms.length > 0

  const toggleRoom = (roomId: string) => {
    setOpenRooms(prev => {
      const next = new Set(prev)
      next.has(roomId) ? next.delete(roomId) : next.add(roomId)
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (isNew) {
      await createWorkflow({ name: name.trim(), property_id: propertyId || null })
    } else {
      await updateWorkflow(id!, { name: name.trim(), property_id: propertyId || null, steps })
    }
    setSaving(false)
    toast.trigger()
  }

  const handleAutoGenerate = async () => {
    if (!id || isNew) return
    setGenerating(true)
    const newSteps = await autoGenerateWorkflow?.(id)
    if (newSteps) setSteps(newSteps)
    setGenerating(false)
  }

  const handleCompleteAuto = async () => {
    if (!id || isNew) return
    setGenerating(true)
    await completeAutoWorkflow?.(id)
    setGenerating(false)
  }

  const handleAddTask = async (task: Task) => {
    if (!addTaskRoomId) return
    const newStep: WorkflowStep = {
      id: `tmp-${Date.now()}`,
      workflow_id: id!,
      room_id: addTaskRoomId,
      task_id: task.id,
      task,
      order_index: (stepsByRoom[addTaskRoomId]?.length ?? 0),
      is_mandatory: newStepMandatory,
    }
    setSteps(prev => [...prev, newStep])
    if (!isNew) await addWorkflowStep?.(id!, { room_id: addTaskRoomId, task_id: task.id, is_mandatory: newStepMandatory })
    setShowAddTask(false)
    setTaskSearch('')
  }

  const handleRemoveStep = async (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId))
    if (!isNew) await removeWorkflowStep?.(stepId)
  }

  const openAddTaskSheet = (roomId: string) => {
    setAddTaskRoomId(roomId)
    setNewStepMandatory(true)
    setTaskSearch('')
    setShowAddTask(true)
  }

  // Tâches déjà dans la pièce sélectionnée
  const roomTaskIds = addTaskRoomId
    ? new Set(stepsByRoom[addTaskRoomId]?.map(s => s.task_id) ?? [])
    : new Set<string>()

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  )

  const propertyOptions = [
    { value: '', label: 'Choisir un logement…' },
    ...properties.map(p => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #EDE0D0' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate"
            style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            {isNew ? 'Nouveau workflow' : (name || 'Workflow')}
          </h1>
          {!isNew && (
            <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
              {totalSteps} étape{totalSteps > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-full"
          style={{ background: name.trim() ? '#6B9E78' : '#EDE0D0', color: name.trim() ? '#fff' : '#C4A882' }}
        >
          {saving ? <Spinner size={14} /> : <Save size={14} />}
          Sauver
        </button>
      </div>

      {/* Nom + logement */}
      <div className="flex flex-col gap-2.5 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid #EDE0D0' }}>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ color: '#C4A882', flexShrink: 0 }}>
            <path d="M2 14l.5-3L11 2.5l2.5 2.5L5 14H2z" stroke="currentColor"
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom du workflow"
            className="flex-1 outline-none text-sm font-semibold"
            style={{ background: 'transparent', color: '#2C1F0E', fontFamily: 'inherit' }}
          />
        </div>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ color: '#C4A882', flexShrink: 0 }}>
            <path d="M1 7L8 2l7 5M2.5 6v7.5h4V10h3v3.5h4V6"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <select
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="flex-1 outline-none text-sm"
            style={{ background: 'transparent', color: '#2C1F0E', fontFamily: 'inherit', appearance: 'none' }}
          >
            {propertyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Corps */}
      <div className="scroll-area px-5 pt-4 pb-5">

        {/* État : pas encore sauvegardé (nouveau) */}
        {isNew && (
          <div className="flex flex-col items-center py-10 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: '#F5F0EA' }}>⚙️</div>
            <p className="text-sm font-semibold" style={{ color: '#A8937A' }}>
              Sauvegardez d'abord le workflow pour ajouter des étapes.
            </p>
            <button onClick={handleSave} disabled={!name.trim()}
              className="text-white text-sm font-bold px-5 py-2.5 rounded-full"
              style={{ background: name.trim() ? '#6B9E78' : '#EDE0D0', color: name.trim() ? '#fff' : '#C4A882' }}>
              Sauvegarder
            </button>
          </div>
        )}

        {/* État : pas de pièces */}
        {!isNew && hasRooms === false && (
          <div className="flex flex-col items-center py-10 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: '#F5F0EA' }}>🏠</div>
            <p className="text-sm font-semibold" style={{ color: '#A8937A' }}>
              Ce logement n'a pas encore de pièces.
            </p>
            <button onClick={() => navigate(`/config/properties/${propertyId}`)}
              className="text-white text-sm font-bold px-5 py-2.5 rounded-full"
              style={{ background: '#6B9E78' }}>
              Configurer les pièces
            </button>
          </div>
        )}

        {/* Contenu principal */}
        {!isNew && hasRooms && (
          <>
            {/* Bouton auto-génération */}
            {!hasSteps ? (
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="flex items-center gap-3 w-full rounded-2xl p-4 mb-4 text-left"
                style={{ background: '#CCFBF1', border: '1px solid #99F6E4' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0D9488', color: '#fff' }}>
                  {generating ? <Spinner size={16} /> : <Zap size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#0F766E' }}>
                    ⚡ Auto-générer les tâches standards
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#14B8A6' }}>
                    Génère automatiquement les étapes pour ce logement
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ color: '#0D9488' }}>
                  <path d="M5.5 3.5L10.5 8l-5 4.5" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={handleCompleteAuto}
                disabled={generating}
                className="flex items-center gap-2 text-xs font-semibold mb-4"
                style={{ color: '#6B9E78' }}
              >
                {generating ? <Spinner size={14} /> : <Zap size={14} />}
                Compléter auto les tâches manquantes
              </button>
            )}

            {/* Sections par pièce */}
            {rooms.map(room => {
              const roomSteps = stepsByRoom[room.id] ?? []
              const isOpen = openRooms.has(room.id)

              return (
                <div key={room.id} className="mb-2.5 rounded-2xl overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #EDE0D0' }}>

                  {/* Header pièce */}
                  <div
                    className="flex items-center gap-2.5 px-3.5 py-3.5"
                    style={{ borderBottom: isOpen ? '1px solid #F5F0EA' : 'none' }}
                  >
                    <div className="cursor-grab flex-shrink-0" style={{ color: '#D5C4AF' }}>
                      <GripVertical size={16} />
                    </div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F5F0EA', color: '#A8937A', fontSize: 14 }}>
                      <RoomEmoji type={room.room_type} />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => toggleRoom(room.id)}>
                      <p className="text-sm font-bold" style={{ color: '#2C1F0E' }}>
                        {room.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#C4A882' }}>
                        {roomSteps.length} tâche{roomSteps.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => openAddTaskSheet(room.id)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: '#EEF4EF', border: '1px solid #B5D4BA', color: '#6B9E78' }}
                    >
                      + Tâche
                    </button>
                    <div onClick={() => toggleRoom(room.id)} className="flex-shrink-0 cursor-pointer"
                      style={{ color: '#D5C4AF' }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Tâches de la pièce */}
                  {isOpen && (
                    <div>
                      {roomSteps.length === 0 ? (
                        <button
                          onClick={() => openAddTaskSheet(room.id)}
                          className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm"
                          style={{ color: '#6B9E78' }}
                        >
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: '#EEF4EF', border: '1.5px dashed #B5D4BA' }}>
                            <Plus size={13} />
                          </div>
                          Ajouter des tâches
                        </button>
                      ) : (
                        <>
                          {roomSteps.map((step, si) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-2.5 px-3.5 py-3"
                              style={{
                                borderBottom: si < roomSteps.length - 1 ? '1px solid #F5F0EA' : 'none',
                              }}
                            >
                              <div className="cursor-grab flex-shrink-0" style={{ color: '#D5C4AF' }}>
                                <GripVertical size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#2C1F0E' }}>
                                  {step.task?.title}
                                </p>
                                <div className="flex gap-1 mt-0.5">
                                  {step.task?.photo_required && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                      style={{ background: '#CCFBF1', color: '#0F766E' }}>
                                      <Camera size={7} />Photo
                                    </span>
                                  )}
                                  {step.task?.video_url && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                      style={{ background: '#FEF3C7', color: '#78350F' }}>
                                      <Play size={7} />Vidéo
                                    </span>
                                  )}
                                  {step.is_mandatory && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                                      style={{ background: '#FEF3C7', color: '#78350F' }}>
                                      Obligatoire
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveStep(step.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: '#FEF2F2', color: '#DC2626' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}

                          {/* Ligne + ajouter */}
                          <button
                            onClick={() => openAddTaskSheet(room.id)}
                            className="flex items-center gap-2 px-3.5 py-3 w-full text-left text-xs font-semibold"
                            style={{ color: '#6B9E78', borderTop: '1px solid #F5F0EA' }}
                          >
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ background: '#EEF4EF', border: '1.5px dashed #B5D4BA' }}>
                              <Plus size={12} />
                            </div>
                            Ajouter une tâche
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Sheet : ajouter une tâche */}
      <BottomSheet
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Ajouter une tâche"
      >
        {/* Search */}
        <div className="relative mb-3">
          <input
            value={taskSearch}
            onChange={e => setTaskSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{
              background: '#F5F0EA', border: '1px solid #EDE0D0',
              color: '#2C1F0E', fontFamily: 'inherit', paddingRight: 36,
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: '#C4A882', pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Toggle obligatoire */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl mb-3"
          style={{ background: '#F5F0EA', border: '1px solid #EDE0D0' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>Obligatoire</p>
            <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>Étape requise dans le workflow</p>
          </div>
          <Toggle label="" checked={newStepMandatory} onChange={setNewStepMandatory} />
        </div>

        {/* Task list */}
        <div className="overflow-y-auto max-h-64">
          {filteredTasks.map(task => {
            const alreadyAdded = roomTaskIds.has(task.id)
            return (
              <button
                key={task.id}
                onClick={() => !alreadyAdded && handleAddTask(task)}
                disabled={alreadyAdded}
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: alreadyAdded ? '#F5F0EA' : 'transparent',
                  opacity: alreadyAdded ? 0.5 : 1,
                  cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: task.photo_required ? '#CCFBF1' : '#F5F0EA',
                    color: task.photo_required ? '#0D9488' : '#A8937A',
                  }}>
                  {task.photo_required
                    ? <Camera size={15} />
                    : task.video_url
                      ? <Play size={15} />
                      : <CheckSquare size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#2C1F0E' }}>
                    {task.title}
                  </p>
                </div>
                {alreadyAdded && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: '#EEF4EF', color: '#6B9E78' }}>
                    Déjà ajoutée
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      <Toast show={toast.show} message="Workflow enregistré ✓" variant="success" />

    </div>
  )
}

function RoomEmoji({ type }: { type?: string }) {
  const map: Record<string, string> = {
    entrance: '🚪', bedroom: '🛏', bathroom: '🛁', wc: '🚿',
    kitchen: '🍳', living: '🛋', balcony: '🌿', terrace: '🌿',
    laundry: '🧺', garage: '🚗', other: '📦',
  }
  return <span>{map[type ?? 'other'] ?? '📦'}</span>
}
