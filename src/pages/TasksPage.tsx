// PAGE: TasksPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, liste triable avec poignées.
// Icône par type de tâche (photo=teal, vidéo=ambre, contrôle=vert, simple=beige).
// Chips de filtre horizontaux. Loupe à droite dans le champ de recherche.
// BottomSheet création/édition. Corbeille à droite de chaque ligne.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Camera, Play, ClipboardCheck, Star, Grip } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { BottomSheet, Input, Textarea, Select, Toggle, Spinner, EmptyState } from '../components/ui'
import type { Task } from '../types'

const TASK_TYPE_CONFIG = {
  simple:   { iconBg: '#F5F0EA',  iconColor: '#A8937A', Icon: Grip },
  photo:    { iconBg: '#CCFBF1',  iconColor: '#0D9488', Icon: Camera },
  video:    { iconBg: '#FEF3C7',  iconColor: '#D97706', Icon: Play },
  control:  { iconBg: '#DCFCE7',  iconColor: '#6B9E78', Icon: ClipboardCheck },
  optional: { iconBg: '#F5F0EA',  iconColor: '#C4A882', Icon: Star },
}

const ROOM_FILTERS = ['Tout', 'Chambre', 'Salle de bain', 'WC', 'Cuisine', 'Salon', 'Entrée', 'Terrasse']

const TASK_TYPE_OPTIONS = [
  { value: 'simple',   label: 'Simple' },
  { value: 'photo',    label: 'Photo requise' },
  { value: 'video',    label: 'Avec vidéo' },
  { value: 'control',  label: 'Contrôle' },
  { value: 'optional', label: 'Optionnel' },
]

export default function TasksPage() {
  const navigate = useNavigate()
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, loading } = useAppStore()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tout')
  const [showSheet, setShowSheet] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('simple')
  const [formMandatory, setFormMandatory] = useState(true)
  const [formPhotoRequired, setFormPhotoRequired] = useState(false)
  const [formCanSkip, setFormCanSkip] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTasks() }, [])

  const openCreate = () => {
    setEditingTask(null)
    setFormTitle(''); setFormDesc(''); setFormType('simple')
    setFormMandatory(true); setFormPhotoRequired(false); setFormCanSkip(false)
    setShowSheet(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormDesc(task.description ?? '')
    setFormType(task.task_type ?? 'simple')
    setFormMandatory(task.is_mandatory ?? true)
    setFormPhotoRequired(task.photo_required ?? false)
    setFormCanSkip(task.can_skip ?? false)
    setShowSheet(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim()) return
    setSaving(true)
    const data = {
      title: formTitle.trim(),
      description: formDesc.trim() || null,
      task_type: formType as import('../types').TaskType,
      is_mandatory: formMandatory,
      photo_required: formPhotoRequired,
      can_skip: formCanSkip,
    }
    if (editingTask) await updateTask(editingTask.id, data)
    else await createTask(data)
    setSaving(false)
    setShowSheet(false)
  }

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tout' || true // TODO: filtrer par type de pièce si disponible
    return matchSearch && matchFilter
  })

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
        <h1 className="text-lg font-bold flex-1" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
          Bibliothèque de tâches
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-full"
          style={{ background: '#6B9E78' }}
        >
          <Plus size={13} />
          Nouvelle
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pt-3.5 pb-0 flex-shrink-0">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une tâche…"
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{
              background: '#fff',
              border: '1px solid #EDE0D0',
              color: '#2C1F0E',
              fontFamily: 'inherit',
              paddingRight: 40,
            }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: '#C4A882', pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto px-5 py-3 flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}>
        {ROOM_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-full flex-shrink-0 transition-all"
            style={{
              background: filter === f ? '#6B9E78' : '#fff',
              border: `1.5px solid ${filter === f ? '#6B9E78' : '#EDE0D0'}`,
              color: filter === f ? '#fff' : '#A8937A',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-[10px] font-bold uppercase tracking-widest px-5 pb-2 flex-shrink-0"
        style={{ color: '#C4A882' }}>
        {filtered.length} tâche{filtered.length > 1 ? 's' : ''}
      </p>

      {/* List */}
      <div className="scroll-area px-5 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={44} />}
            title="Aucune tâche"
            subtitle="Créez votre première tâche réutilisable."
            action={
              <button onClick={openCreate}
                className="text-white text-sm font-bold px-4 py-2 rounded-full"
                style={{ background: '#6B9E78' }}>
                Créer une tâche
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(task => {
              const typeCfg = TASK_TYPE_CONFIG[task.task_type as keyof typeof TASK_TYPE_CONFIG]
                ?? TASK_TYPE_CONFIG.simple
              const TypeIcon = typeCfg.Icon

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-2xl px-3.5 py-3 cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ background: '#fff', border: '1px solid #EDE0D0' }}
                  onClick={() => openEdit(task)}
                >
                  {/* Grip */}
                  <div className="flex-shrink-0 cursor-grab" style={{ color: '#D5C4AF' }}>
                    <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                      <circle cx="4" cy="5"  r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="5"  r="1.5" fill="currentColor"/>
                      <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="4" cy="15" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
                    </svg>
                  </div>

                  {/* Icône type */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: typeCfg.iconBg, color: typeCfg.iconColor }}>
                    <TypeIcon size={16} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#2C1F0E' }}>
                      {task.title}
                    </p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {task.photo_required && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#CCFBF1', color: '#0F766E' }}>
                          📷 Photo
                        </span>
                      )}
                      {task.is_mandatory && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#FEF3C7', color: '#78350F' }}>
                          Obligatoire
                        </span>
                      )}
                      {task.can_skip && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#F5F0EA', color: '#A8937A' }}>
                          Passable
                        </span>
                      )}
                      {task.video_url && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: '#FEF3C7', color: '#78350F' }}>
                          ▶ Vidéo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(task.id) }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#FEF2F2', color: '#DC2626' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M12 3.5l-.7 8a1 1 0 0 1-1 .9H3.7a1 1 0 0 1-1-.9L2 3.5"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit sheet */}
      <BottomSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        title={editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
      >
        <div className="flex flex-col gap-3 mb-5">
          <Input
            label="Titre *"
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Ex : Aspirer le salon"
          />
          <Textarea
            label="Description"
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            rows={2}
          />
          <Select
            label="Type"
            value={formType}
            onChange={e => setFormType(e.target.value)}
            options={TASK_TYPE_OPTIONS}
          />

          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#FAF7F2', border: '1px solid #EDE0D0' }}>
            {[
              { label: 'Obligatoire',    sub: 'Cette tâche doit être effectuée', val: formMandatory,    set: setFormMandatory },
              { label: 'Photo requise',  sub: 'Une photo sera demandée',         val: formPhotoRequired, set: setFormPhotoRequired },
              { label: 'Passable',       sub: 'L\'agent peut sauter cette étape', val: formCanSkip,     set: setFormCanSkip },
            ].map((item, i, arr) => (
              <div key={item.label}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #EDE0D0' : 'none' }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{item.sub}</p>
                </div>
                <Toggle label="" checked={item.val} onChange={item.set} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!formTitle.trim() || saving}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{
            background: formTitle.trim() ? '#6B9E78' : '#EDE0D0',
            color: formTitle.trim() ? '#fff' : '#C4A882',
          }}
        >
          {saving ? 'Enregistrement…' : editingTask ? 'Enregistrer les modifications' : 'Créer la tâche'}
        </button>
      </BottomSheet>

    </div>
  )
}
