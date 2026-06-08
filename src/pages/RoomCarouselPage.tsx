import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Camera, Check } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Spinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import {
  PREMIUM_GESTURES_LIBRARY,
  PremiumGesturesDropdown,
  ROOM_CONFIG,
  type RoomType,
} from './PremiumGestures'

export default function RoomCarouselPage() {
  const { id: missionId, roomId } = useParams()
  const navigate = useNavigate()
  const { missions, fetchMission, completeTask } = useAppStore()

  const mission = missions.find(m => m.id === missionId)

  const tasks = (mission?.steps ?? [])
    .filter(s => s.room_id === roomId)
    .sort((a, b) => a.order_index - b.order_index)

  const room = tasks[0]?.room
  const totalTasks = tasks.length

  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set(
    tasks.filter(t => t.status === 'completed').map(t => t.id)
  ))
  const [takenPhotos, setTakenPhotos] = useState<Record<string, string>>({})
  const [premiumChecked, setPremiumChecked] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  useEffect(() => { if (!mission) fetchMission?.(missionId!) }, [])

  useEffect(() => {
    setCompletedTaskIds(new Set(
      tasks.filter(t => t.status === 'completed').map(t => t.id)
    ))
  }, [mission])

  const currentIndex = tasks.findIndex(t => !completedTaskIds.has(t.id))
  const allDone = currentIndex === -1 && totalTasks > 0
  const currentTask = allDone ? null : tasks[currentIndex]
  const isLastTask = currentIndex === tasks.length - 1
  const isPhotoTask = currentTask?.task?.photo_required ?? false
  const hasPhoto = currentTask ? !!takenPhotos[currentTask.id] : false

  const progressPercent = totalTasks > 0 ? (completedTaskIds.size / totalTasks) * 100 : 0

  const handleTakePhoto = (taskId: string) => {
    setPendingTaskId(taskId)
    fileInputRef.current?.click()
  }

  const handlePhotoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingTaskId) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `missions/${missionId}/tasks/${pendingTaskId}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('mission-photos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('mission-photos').getPublicUrl(path)
      setTakenPhotos(prev => ({ ...prev, [pendingTaskId]: data.publicUrl }))
      await completeTask?.(pendingTaskId, { photo_url: data.publicUrl })
      setCompletedTaskIds(prev => new Set([...prev, pendingTaskId]))
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
    setPendingTaskId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCheckTask = async (taskId: string) => {
    await completeTask?.(taskId, {})
    setCompletedTaskIds(prev => new Set([...prev, taskId]))
  }

  const handleGoToFinalPhotos = () => {
    navigate(`/missions/${missionId}/rooms/${roomId}/photos`)
  }

  if (!mission || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
        <Spinner size={28} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoInput}
      />

      {/* Top bar */}
      <div className="flex items-center gap-2.5 px-5 pt-14 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #EDE0D0' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
        >
          <X size={16} />
        </button>

        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#EDE0D0' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: isPhotoTask ? '#0D9488' : '#6B9E78',
            }}
          />
        </div>

        <span className="text-xs font-bold flex-shrink-0"
          style={{ color: isPhotoTask ? '#0D9488' : '#6B9E78' }}>
          {completedTaskIds.size}/{totalTasks}
        </span>

        <button
          onClick={() => navigate(`/missions/${missionId}/anomaly`)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
        >
          <svg width="14" height="4" viewBox="0 0 14 4" fill="none">
            <circle cx="1.5" cy="2" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="2" r="1.5" fill="currentColor"/>
            <circle cx="12.5" cy="2" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Hero */}
      <div className="px-5 pt-3 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #EDE0D0' }}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2"
          style={{ background: '#F5F0EA', border: '1px solid #EDE0D0' }}>
          <span style={{ fontSize: 11 }}>
            {ROOM_CONFIG[room?.room_type as RoomType]?.emoji ?? '📦'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>
            {room?.name ?? 'Pièce'}
          </span>
        </div>
        <h1 className="font-bold leading-tight" style={{ fontSize: 26, color: '#2C1F0E', letterSpacing: '-0.03em' }}>
          {allDone ? 'Tâches terminées !' : (currentTask?.task?.title ?? '')}
        </h1>
      </div>

      {/* Points carrousel */}
      <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
        {tasks.map((task, i) => {
          const isDone = completedTaskIds.has(task.id)
          const isActive = i === currentIndex
          const isPhoto = task.task?.photo_required
          return (
            <div key={task.id} style={{
              width: isActive ? 9 : 6,
              height: isActive ? 9 : 6,
              borderRadius: '50%',
              background: isDone ? '#6B9E78'
                : isActive ? (isPhoto ? '#0D9488' : '#6B9E78')
                : '#EDE0D0',
              transition: 'all 0.2s',
              flexShrink: 0,
            }} />
          )
        })}
      </div>

      {/* Contenu slide */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-3" style={{ scrollbarWidth: 'none' }}>

        {allDone ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div style={{ fontSize: 48 }}>✅</div>
            <p className="text-base font-bold text-center" style={{ color: '#2C4A30' }}>
              {completedTaskIds.size} tâches validées
            </p>
            <p className="text-sm text-center" style={{ color: '#A8937A' }}>
              Place aux photos finales de la pièce
            </p>
          </div>
        ) : (
          <>
            {/* Gestes 5★ sur la dernière tâche uniquement */}
            {isLastTask && (
              <div className="mb-3">
                <PremiumGesturesDropdown
                  roomType={room?.room_type as RoomType ?? 'bedroom'}
                  enabledGestureIds={new Set(
                    PREMIUM_GESTURES_LIBRARY
                      .filter(g => g.room_type === room?.room_type)
                      .map(g => g.id)
                  )}
                  checkedIds={premiumChecked}
                  onToggle={(id) => setPremiumChecked(prev => {
                    const next = new Set(prev)
                    next.has(id) ? next.delete(id) : next.add(id)
                    return next
                  })}
                />
              </div>
            )}

            {isPhotoTask ? (
              <>
                {currentTask?.task?.reference_photo_url && (
                  <>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0D9488' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C4A882' }}>
                        À reproduire
                      </span>
                    </div>
                    <div className="rounded-3xl overflow-hidden mb-3" style={{ border: '2px solid #0D9488' }}>
                      <img
                        src={currentTask.task.reference_photo_url}
                        alt="Modèle"
                        className="w-full object-cover"
                        style={{ height: 180 }}
                      />
                      <div className="px-4 py-2" style={{ background: '#0D9488', color: '#fff' }}>
                        <span className="text-xs font-semibold">Standard attendu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1" style={{ height: 1, background: '#EDE0D0' }} />
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#6B9E78' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v10M2 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1" style={{ height: 1, background: '#EDE0D0' }} />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6B9E78' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C4A882' }}>
                    Ma photo
                  </span>
                </div>

                {hasPhoto ? (
                  <div className="rounded-2xl overflow-hidden mb-2" style={{ border: '2px solid #6B9E78' }}>
                    <img src={takenPhotos[currentTask!.id]} alt="Ma photo"
                      className="w-full object-cover" style={{ height: 120 }} />
                    <button
                      onClick={() => handleTakePhoto(currentTask!.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold"
                      style={{ background: '#EEF4EF', color: '#6B9E78', border: 'none', fontFamily: 'inherit' }}
                    >
                      <Camera size={13} /> Reprendre
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => handleTakePhoto(currentTask!.id)}
                    className="rounded-2xl flex items-center justify-center gap-2 cursor-pointer mb-2"
                    style={{ height: 100, background: '#EEF4EF', border: '2px dashed #B5D4BA', color: '#6B9E78' }}
                  >
                    <Camera size={22} />
                    <span className="text-sm font-semibold">
                      {currentTask?.task?.reference_photo_url ? 'Reproduire le modèle' : 'Prendre la photo'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div style={{ fontSize: 44 }}>
                  {ROOM_CONFIG[room?.room_type as RoomType]?.emoji ?? '✓'}
                </div>
                {currentTask?.task?.description && (
                  <p className="text-sm" style={{ color: '#A8937A', lineHeight: 1.6 }}>
                    {currentTask.task.description}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        {allDone ? (
          <button
            onClick={handleGoToFinalPhotos}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#0D9488', border: 'none' }}
          >
            <Camera size={18} /> Photos finales →
          </button>
        ) : isPhotoTask ? (
          uploading ? (
            <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
              style={{ background: '#EDE0D0', color: '#C4A882', border: 'none' }}>
              <Spinner size={18} /> Upload en cours…
            </button>
          ) : hasPhoto ? (
            <button
              onClick={() => setCompletedTaskIds(prev => new Set([...prev, currentTask!.id]))}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
              style={{ background: '#6B9E78', border: 'none' }}
            >
              <Check size={18} /> Valider et continuer
            </button>
          ) : (
            <button
              onClick={() => handleTakePhoto(currentTask!.id)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
              style={{ background: '#0D9488', border: 'none' }}
            >
              <Camera size={18} /> Prendre la photo
            </button>
          )
        ) : (
          <button
            onClick={() => handleCheckTask(currentTask!.id)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#6B9E78', border: 'none' }}
          >
            <Check size={18} /> C'est fait
          </button>
        )}
      </div>

    </div>
  )
}
