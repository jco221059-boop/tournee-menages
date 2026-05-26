// PAGE: MissionFinalPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, checklist visuelle avec icônes colorées.
// Anneau de progression SVG en haut. Items cochés en vert sauge, non cochés en beige.
// Sélection statut final en 3 cartes radio. CTA grisé tant qu'incomplet.

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Spinner } from '../components/ui'

const CHECKLIST_ITEMS = [
  { id: 'keys',    label: 'Clés remises / boîte fermée', icon: '🔑' },
  { id: 'trash',   label: 'Poubelles sorties',           icon: '🗑️' },
  { id: 'windows', label: 'Fenêtres fermées',            icon: '💨' },
  { id: 'lights',  label: 'Lumières éteintes',           icon: '💡' },
  { id: 'door',    label: 'Porte fermée à clé',          icon: '🚪' },
  { id: 'photo',   label: 'Photo porte prise',           icon: '📷' },
]

const STATUS_OPTIONS = [
  {
    value: 'ready',
    emoji: '✅',
    label: 'Logement prêt',
    desc: 'Tout est parfait, prêt pour le check-in',
    borderColor: '#6B9E78',
    bg: '#EEF4EF',
    textColor: '#2C4A30',
  },
  {
    value: 'ready_with_note',
    emoji: '⚠️',
    label: 'Prêt avec remarque',
    desc: 'Quelques points à signaler',
    borderColor: '#D97706',
    bg: '#FFFBF0',
    textColor: '#78350F',
  },
  {
    value: 'not_ready',
    emoji: '❌',
    label: 'Logement non prêt',
    desc: 'Problème bloquant détecté',
    borderColor: '#DC2626',
    bg: '#FEF2F2',
    textColor: '#7F1D1D',
  },
]

export default function MissionFinalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { completeMission } = useAppStore()

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [finalStatus, setFinalStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const totalItems = CHECKLIST_ITEMS.length
  const checkedCount = checked.size
  const allChecked = checkedCount === totalItems
  const canSubmit = allChecked && !!finalStatus

  const toggleItem = (itemId: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    await completeMission(id!, { final_status: finalStatus })
    setSubmitting(false)
    navigate(`/missions/${id}/report`)
  }

  // Anneau SVG
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (checkedCount / totalItems) * circumference

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
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            Fermeture finale
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
            Vérifiez avant de quitter
          </p>
        </div>
      </div>

      {/* Progress ring */}
      <div className="flex items-center gap-5 px-5 pt-5 pb-2 flex-shrink-0">
        <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80"
            style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="40" cy="40" r={radius}
              fill="none" stroke="#EDE0D0" strokeWidth="7"
            />
            <circle
              cx="40" cy="40" r={radius}
              fill="none" stroke="#6B9E78" strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
              {checkedCount}/{totalItems}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: '#C4A882' }}>
              cochés
            </span>
          </div>
        </div>
        <div>
          <p className="text-base font-bold mb-1" style={{ color: '#2C1F0E' }}>
            {allChecked ? 'Tout est vérifié !' : 'Presque prêt !'}
          </p>
          <p className="text-sm" style={{ color: '#A8937A', lineHeight: 1.5 }}>
            {allChecked
              ? 'Choisissez le statut final du logement.'
              : `${totalItems - checkedCount} point${totalItems - checkedCount > 1 ? 's' : ''} restant${totalItems - checkedCount > 1 ? 's' : ''} avant d'envoyer.`}
          </p>
        </div>
      </div>

      <div className="scroll-area px-5 pt-4 pb-5">

        {/* Checklist */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>
          Checklist de départ
        </p>
        <div className="flex flex-col gap-2 mb-7">
          {CHECKLIST_ITEMS.map(item => {
            const isChecked = checked.has(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98]"
                style={{
                  background: isChecked ? '#EEF4EF' : '#fff',
                  border: `1.5px solid ${isChecked ? '#B5D4BA' : '#EDE0D0'}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{
                    background: isChecked ? '#6B9E78' : '#F5F0EA',
                  }}
                >
                  {isChecked
                    ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3.5 9l4 4 7-7" stroke="#fff" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    : <span>{item.icon}</span>
                  }
                </div>
                <span
                  className="text-sm font-semibold flex-1"
                  style={{ color: isChecked ? '#2C4A30' : '#2C1F0E' }}
                >
                  {item.label}
                </span>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isChecked ? '#6B9E78' : 'transparent',
                    border: `2px solid ${isChecked ? '#6B9E78' : '#EDE0D0'}`,
                  }}
                >
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Statut final */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>
          Statut final du logement
        </p>
        <div className="flex flex-col gap-2">
          {STATUS_OPTIONS.map(opt => {
            const isSelected = finalStatus === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setFinalStatus(opt.value)}
                className="flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98]"
                style={{
                  background: isSelected ? opt.bg : '#fff',
                  border: `1.5px solid ${isSelected ? opt.borderColor : '#EDE0D0'}`,
                }}
              >
                <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold"
                    style={{ color: isSelected ? opt.textColor : '#2C1F0E' }}>
                    {opt.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                    {opt.desc}
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: `2px solid ${isSelected ? opt.borderColor : '#EDE0D0'}`,
                    background: isSelected ? opt.borderColor : 'transparent',
                  }}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all"
          style={{
            background: canSubmit ? '#6B9E78' : '#EDE0D0',
            color: canSubmit ? '#fff' : '#C4A882',
          }}
        >
          {submitting
            ? <Spinner size={20} />
            : <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
          }
          {submitting ? 'Envoi…' : 'Envoyer le rapport'}
        </button>
      </div>

    </div>
  )
}
