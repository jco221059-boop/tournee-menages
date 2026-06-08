import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, Check } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Spinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import { ROOM_CONFIG, type RoomType } from './PremiumGestures'

export default function RoomFinalPhotoPage() {
  const { id: missionId, roomId } = useParams()
  const navigate = useNavigate()
  const { missions, fetchMission, completeRoomFinalPhotos } = useAppStore()

  const mission = missions.find(m => m.id === missionId)

  const finalPhotoSlots = (mission?.workflow?.room_final_photos ?? [])
    .filter(s => s.room_id === roomId)
    .sort((a, b) => a.order_index - b.order_index)

  const room = (mission?.property?.rooms ?? []).find(r => r.id === roomId)
    ?? (mission?.steps ?? []).find(s => s.room_id === roomId)?.room
  const totalSlots = finalPhotoSlots.length

  const [takenPhotos, setTakenPhotos] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!mission) fetchMission?.(missionId!) }, [])

  const currentIndex = finalPhotoSlots.findIndex(s => !takenPhotos[s.id])
  const allDone = totalSlots > 0 && Object.keys(takenPhotos).length >= totalSlots
  const current = allDone ? null : finalPhotoSlots[currentIndex]

  // Pièces dans l'ordre pour navigation
  const rooms = (mission?.property?.rooms ?? [])
    .filter(r => (mission?.steps ?? []).some(s => s.room_id === r.id))
    .sort((a, b) => a.order_index - b.order_index)
  const currentRoomIndex = rooms.findIndex(r => r.id === roomId)
  const nextRoom = rooms[currentRoomIndex + 1]
  const nextRoomCfg = nextRoom ? ROOM_CONFIG[nextRoom.room_type as RoomType] : null

  const handleTakePhoto = (slotId: string) => {
    setPendingSlotId(slotId)
    fileInputRef.current?.click()
  }

  const handlePhotoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingSlotId) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `missions/${missionId}/final/${roomId}-${pendingSlotId}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('mission-photos').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('mission-photos').getPublicUrl(path)
      setTakenPhotos(prev => ({ ...prev, [pendingSlotId]: data.publicUrl }))
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
    setPendingSlotId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleValidateRoom = async () => {
    setSubmitting(true)
    await completeRoomFinalPhotos?.(missionId!, roomId!, takenPhotos)
    setSubmitting(false)

    if (nextRoom) {
      navigate(`/missions/${missionId}/rooms/${nextRoom.id}/tasks`, { replace: true })
    } else {
      navigate(`/missions/${missionId}/final`, { replace: true })
    }
  }

  if (!mission || finalPhotoSlots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
        <Spinner size={28} />
      </div>
    )
  }

  const roomCfg = room ? ROOM_CONFIG[room.room_type as RoomType] : null

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
      <div className="flex items-center justify-between px-5 pt-14 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #EDE0D0' }}>
        <div style={{ width: 32 }} />
        <span className="text-sm font-bold" style={{ color: '#0D9488' }}>Photos finales</span>
        <div style={{ width: 32 }} />
      </div>

      {/* Hero */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid #EDE0D0' }}>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2"
          style={{
            background: allDone ? '#DCFCE7' : '#CCFBF1',
            border: `1px solid ${allDone ? '#B5D4BA' : '#99F6E4'}`,
          }}
        >
          <span style={{ fontSize: 12 }}>📸</span>
          <span className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: allDone ? '#166534' : '#0D9488' }}>
            {roomCfg?.label ?? 'Pièce'}{allDone ? ' ✓' : ''}
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C1F0E', letterSpacing: '-0.025em' }}>
          Photos finales
        </h1>
        <p className="text-xs mt-1" style={{ color: '#A8937A' }}>
          {allDone
            ? `${totalSlots} / ${totalSlots} photos prises`
            : 'Prouvez que la pièce est prête'}
        </p>
      </div>

      {/* Points carrousel */}
      <div className="flex items-center justify-center gap-2 py-3 flex-shrink-0">
        {finalPhotoSlots.map((slot, i) => {
          const isDone = !!takenPhotos[slot.id]
          const isActive = i === currentIndex
          return (
            <div key={slot.id} style={{
              width: isActive ? 10 : isDone ? 8 : 7,
              height: isActive ? 10 : isDone ? 8 : 7,
              borderRadius: '50%',
              background: isDone ? '#6B9E78' : isActive ? '#0D9488' : '#EDE0D0',
              transition: 'all 0.2s',
            }} />
          )
        })}
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: 'none' }}>

        {allDone ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div style={{ fontSize: 52 }}>✅</div>
            <p className="text-lg font-bold" style={{ color: '#2C4A30' }}>
              {roomCfg?.label ?? 'Pièce'} validée
            </p>
            <p className="text-sm" style={{ color: '#A8937A' }}>
              {totalSlots} photo{totalSlots > 1 ? 's' : ''} prise{totalSlots > 1 ? 's' : ''}
            </p>
          </div>
        ) : current ? (
          <>
            <p className="text-sm font-bold text-center mb-4" style={{ color: '#0D9488' }}>
              {current.label}
            </p>

            {/* Photo modèle */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0D9488' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C4A882' }}>
                À reproduire
              </span>
            </div>
            <div className="rounded-3xl overflow-hidden mb-4" style={{ border: '2px solid #0D9488' }}>
              <img
                src={current.reference_photo_url}
                alt="Modèle"
                className="w-full object-cover"
                style={{ height: 200 }}
              />
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ background: '#0D9488', color: '#fff' }}>
                <span className="text-xs font-semibold">Standard attendu</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.25)' }}>
                  Obligatoire
                </span>
              </div>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1" style={{ height: 1, background: '#EDE0D0' }} />
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#6B9E78' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M3 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1" style={{ height: 1, background: '#EDE0D0' }} />
            </div>

            {/* Ma photo */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6B9E78' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C4A882' }}>
                Ma photo
              </span>
            </div>
            <div
              onClick={() => !uploading && handleTakePhoto(current.id)}
              className="rounded-3xl flex items-center justify-center gap-2 cursor-pointer"
              style={{ height: 120, background: '#EEF4EF', border: '2px dashed #B5D4BA', color: '#6B9E78' }}
            >
              {uploading && pendingSlotId === current.id
                ? <Spinner size={24} />
                : <>
                    <Camera size={24} />
                    <span className="text-sm font-semibold">Reproduire le modèle</span>
                  </>
              }
            </div>
          </>
        ) : null}
      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        {allDone ? (
          <button
            onClick={handleValidateRoom}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#6B9E78', border: 'none' }}
          >
            {submitting ? <Spinner size={18} /> : <Check size={18} />}
            {submitting
              ? 'Validation…'
              : nextRoomCfg
                ? `${nextRoomCfg.emoji} Passer à la ${nextRoomCfg.label} →`
                : '✓ Fermeture finale →'}
          </button>
        ) : (
          <button
            onClick={() => current && handleTakePhoto(current.id)}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#0D9488', border: 'none' }}
          >
            {uploading ? <Spinner size={18} /> : <Camera size={18} />}
            {uploading ? 'Upload…' : 'Prendre la photo'}
          </button>
        )}
      </div>

    </div>
  )
}
