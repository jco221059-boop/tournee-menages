// PAGE: MissionPreviewPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches par pièce.
// Accordion ouvert/fermé par pièce. Badges photo/obligatoire sur chaque tâche.
// Bandeau info avec compteurs pièces/tâches. Poignée drag visible. CTA fixe vert.

import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, GripVertical, ChevronDown, ChevronUp, Camera, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Spinner } from '../components/ui'
import type { Room } from '../types'

export default function MissionPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { missions, reorderMissionRooms, startMission } = useAppStore()

  const mission = missions.find(m => m.id === id)
  const [openRooms, setOpenRooms] = useState<Set<string>>(
    new Set(mission?.steps?.map(s => s.room_id).slice(0, 2) ?? [])
  )
  const [roomOrder, setRoomOrder] = useState<string[]>(() => {
    if (!mission) return []
    const seen = new Set<string>()
    const order: string[] = []
    for (const step of (mission.steps ?? [])) {
      if (step.room_id && !seen.has(step.room_id)) {
        seen.add(step.room_id)
        order.push(step.room_id)
      }
    }
    return order
  })
  const [starting, setStarting] = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  if (!mission) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
      <Spinner size={28} />
    </div>
  )

  // Grouper les étapes par pièce
  const stepsByRoom = new Map<string, { room: Room; steps: NonNullable<typeof mission.steps> }>()
  for (const step of (mission.steps ?? [])) {
    if (!step.room_id || !step.room) continue
    if (!stepsByRoom.has(step.room_id)) {
      stepsByRoom.set(step.room_id, { room: step.room, steps: [] as NonNullable<typeof mission.steps> })
    }
    stepsByRoom.get(step.room_id)!.steps.push(step)
  }

  const totalTasks = mission.steps?.length ?? 0
  const totalRooms = roomOrder.length

  const toggleRoom = (roomId: string) => {
    setOpenRooms(prev => {
      const next = new Set(prev)
      if (next.has(roomId)) next.delete(roomId)
      else next.add(roomId)
      return next
    })
  }

  const handleDragStart = (index: number) => { dragItem.current = index }
  const handleDragEnter = (index: number) => { dragOver.current = index }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const newOrder = [...roomOrder]
    const dragged = newOrder.splice(dragItem.current, 1)[0]
    newOrder.splice(dragOver.current, 0, dragged)
    setRoomOrder(newOrder)
    dragItem.current = null
    dragOver.current = null
    reorderMissionRooms?.(id!, newOrder)
  }

  const handleStart = async () => {
    setStarting(true)
    await startMission?.(id!)
    setStarting(false)
    navigate(`/missions/${id}/steps`)
  }

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
          <h1 className="text-lg font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            Aperçu de la mission
          </h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#A8937A' }}>
            {mission.property?.name}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-5 mt-4 flex-shrink-0 flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{ background: '#EEF4EF', border: '1px solid #B5D4BA' }}>
        <GripVertical size={16} style={{ color: '#6B9E78', flexShrink: 0 }} />
        <p className="text-xs flex-1" style={{ color: '#2C4A30' }}>
          Glissez pour réordonner les pièces
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: '#fff', border: '1px solid #B5D4BA', color: '#2C4A30' }}>
          {totalRooms} pièces
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: '#fff', border: '1px solid #B5D4BA', color: '#2C4A30' }}>
          {totalTasks} tâches
        </span>
      </div>

      {/* Room list */}
      <div className="scroll-area px-5 pt-4 pb-5">
        {roomOrder.map((roomId, index) => {
          const entry = stepsByRoom.get(roomId)
          if (!entry) return null
          const { room, steps: roomSteps } = entry
          const isOpen = openRooms.has(roomId)

          return (
            <div
              key={roomId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className="mb-2.5 rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #EDE0D0' }}
            >
              {/* Room header */}
              <div
                className="flex items-center gap-2.5 px-3.5 py-3.5 cursor-pointer"
                style={{ borderBottom: isOpen ? '1px solid #F5F0EA' : 'none' }}
                onClick={() => toggleRoom(roomId)}
              >
                <div className="cursor-grab flex-shrink-0" style={{ color: '#D5C4AF' }}>
                  <GripVertical size={16} />
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F5F0EA', color: '#A8937A', fontSize: 15 }}>
                  <RoomIcon type={room.room_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: '#2C1F0E' }}>
                    {room.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#C4A882' }}>
                    {room.room_type}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#F5F0EA', color: '#A8937A' }}>
                  {(roomSteps ?? []).length} tâche{(roomSteps ?? []).length > 1 ? 's' : ''}
                </span>
                <div style={{ color: '#D5C4AF', flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Task list */}
              {isOpen && (
                <div>
                  {(roomSteps ?? []).map((step, si) => (
                    <div key={step.id}
                      className="flex items-center gap-2.5 px-3.5 py-2.5"
                      style={{ borderBottom: si < roomSteps.length - 1 ? '1px solid #F5F0EA' : 'none' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#F5F0EA' }}>
                        <span className="text-[9px] font-bold" style={{ color: '#C4A882' }}>
                          {si + 1}
                        </span>
                      </div>
                      <p className="text-sm flex-1 truncate" style={{ color: '#2C1F0E' }}>
                        {step.task?.title}
                      </p>
                      <div className="flex gap-1 flex-shrink-0">
                        {step.task?.photo_required && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: '#CCFBF1', color: '#0F766E' }}>
                            <Camera size={8} />Photo
                          </span>
                        )}
                        {step.is_mandatory && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#FEF3C7', color: '#78350F' }}>
                            Obligatoire
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: '#6B9E78' }}
        >
          {starting ? <Spinner size={20} /> : '▶'}
          {starting ? 'Démarrage…' : 'Démarrer le ménage'}
        </button>
      </div>

    </div>
  )
}

function RoomIcon({ type }: { type?: string }) {
  const icons: Record<string, string> = {
    entrance: '🚪', bedroom: '🛏', bathroom: '🛁', wc: '🚿',
    kitchen: '🍳', living: '🛋', balcony: '🌿', terrace: '🌿',
    laundry: '🧺', garage: '🚗', other: '📦',
  }
  return <span>{icons[type ?? 'other'] ?? '📦'}</span>
}
