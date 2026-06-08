import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { RoomType } from '../types'

export type { RoomType }

export const ROOM_CONFIG: Record<RoomType, { emoji: string; label: string }> = {
  entrance: { emoji: '🚪', label: 'Entrée' },
  bedroom:  { emoji: '🛏', label: 'Chambre' },
  bathroom: { emoji: '🛁', label: 'Salle de bain' },
  wc:       { emoji: '🚿', label: 'WC' },
  kitchen:  { emoji: '🍳', label: 'Cuisine' },
  living:   { emoji: '🛋', label: 'Séjour' },
  balcony:  { emoji: '🌿', label: 'Balcon' },
  terrace:  { emoji: '🌿', label: 'Terrasse' },
  laundry:  { emoji: '🧺', label: 'Buanderie' },
  garage:   { emoji: '🚗', label: 'Garage' },
  other:    { emoji: '📦', label: 'Autre' },
}

export interface PremiumGesture {
  id: string
  label: string
  room_type: RoomType
}

export const PREMIUM_GESTURES_LIBRARY: PremiumGesture[] = [
  { id: 'bed_hospital_fold', label: 'Pli hôtelier sur les draps', room_type: 'bedroom' },
  { id: 'towel_origami',     label: 'Origami serviette',         room_type: 'bathroom' },
  { id: 'tp_fold',           label: 'Bout pointu papier toilette', room_type: 'wc' },
  { id: 'fridge_clean',      label: 'Nettoyage intérieur frigo', room_type: 'kitchen' },
  { id: 'welcome_tray',      label: 'Plateau de bienvenue',      room_type: 'living' },
  { id: 'cushion_align',     label: 'Alignement coussins',       room_type: 'living' },
]

interface Props {
  roomType: RoomType
  enabledGestureIds: Set<string>
  checkedIds: Set<string>
  onToggle: (id: string) => void
}

export function PremiumGesturesDropdown({ roomType, enabledGestureIds, checkedIds, onToggle }: Props) {
  const [open, setOpen] = useState(false)
  const gestures = PREMIUM_GESTURES_LIBRARY.filter(g => g.room_type === roomType && enabledGestureIds.has(g.id))

  if (gestures.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14 }}>⭐</span>
          <span className="text-xs font-bold" style={{ color: '#D97706' }}>
            Gestes 5★ ({gestures.filter(g => checkedIds.has(g.id)).length}/{gestures.length})
          </span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#D5C4AF' }} /> : <ChevronDown size={14} style={{ color: '#D5C4AF' }} />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #F5F0EA' }}>
          {gestures.map(g => (
            <label key={g.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              style={{ borderBottom: '1px solid #F5F0EA' }}>
              <div
                onClick={() => onToggle(g.id)}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: checkedIds.has(g.id) ? '#D97706' : 'transparent',
                  border: `1.5px solid ${checkedIds.has(g.id) ? '#D97706' : '#EDE0D0'}`,
                }}
              >
                {checkedIds.has(g.id) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-sm flex-1" style={{ color: '#2C1F0E' }}>{g.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
