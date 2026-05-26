// PAGE: AnomalyPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, grille 3 colonnes pour les types.
// Type sélectionné en rouge doux. Urgence en 3 chips colorés.
// Toggle "bloquant" en card. CTA rouge. Textarea optionnelle.

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Toggle, Spinner } from '../components/ui'

const ANOMALY_TYPES = [
  { id: 'broken',      label: 'Objet cassé',        icon: '🔧' },
  { id: 'stain',       label: 'Tache',               icon: '🟤' },
  { id: 'forgotten',   label: 'Objet oublié',        icon: '📦' },
  { id: 'linen',       label: 'Linge manquant',      icon: '🛏' },
  { id: 'product',     label: 'Produit manquant',    icon: '🧴' },
  { id: 'dirty',       label: 'Très sale',           icon: '🤢' },
  { id: 'late',        label: 'Départ tardif',       icon: '🕐' },
  { id: 'leak',        label: 'Fuite',               icon: '💧' },
  { id: 'smell',       label: 'Odeur',               icon: '👃' },
  { id: 'appliance',   label: 'Appareil en panne',   icon: '⚡' },
  { id: 'lock',        label: 'Problème serrure',    icon: '🔑' },
  { id: 'keybox',      label: 'Boîte à clés',        icon: '📫' },
  { id: 'consumable',  label: 'Consommable manquant', icon: '🧻' },
  { id: 'urgent',      label: 'Urgent',              icon: '🚨' },
  { id: 'other',       label: 'Autre',               icon: '📝' },
]

const URGENCY_OPTIONS = [
  { value: 'low',    label: 'Faible',  dot: '#6B9E78', activeBg: '#EEF4EF', activeBorder: '#6B9E78', activeText: '#2C4A30' },
  { value: 'medium', label: 'Moyenne', dot: '#D97706', activeBg: '#FFFBF0', activeBorder: '#D97706', activeText: '#78350F' },
  { value: 'urgent', label: 'Urgent',  dot: '#DC2626', activeBg: '#FEF2F2', activeBorder: '#DC2626', activeText: '#7F1D1D' },
]

export default function AnomalyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { createAnomaly } = useAppStore()

  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'urgent'>('medium')
  const [isBlocking, setIsBlocking] = useState(false)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const canSubmit = !!selectedType

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    await createAnomaly({
      mission_id: id!,
      anomaly_type: selectedType!,
      urgency,
      is_blocking: isBlocking,
      comment: comment.trim() || null,
    })
    setSaving(false)
    navigate(-1)
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
        <h1 className="text-lg font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
          Signaler un problème
        </h1>
      </div>

      <div className="scroll-area px-5 pt-5 pb-5">

        {/* Type */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>
          Type de problème
        </p>
        <div className="grid grid-cols-3 gap-2 mb-7">
          {ANOMALY_TYPES.map(type => {
            const isSelected = selectedType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="flex flex-col items-center gap-1.5 rounded-2xl py-3 px-2 transition-all active:scale-[0.96]"
                style={{
                  background: isSelected ? '#FEF2F2' : '#fff',
                  border: `1.5px solid ${isSelected ? '#DC2626' : '#EDE0D0'}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{
                    background: isSelected ? '#FECACA' : '#F5F0EA',
                  }}
                >
                  {type.icon}
                </div>
                <span
                  className="text-[10px] font-semibold text-center leading-tight"
                  style={{ color: isSelected ? '#7F1D1D' : '#A8937A' }}
                >
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Urgence */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>
          Niveau d'urgence
        </p>
        <div className="flex gap-2 mb-7">
          {URGENCY_OPTIONS.map(opt => {
            const isActive = urgency === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setUrgency(opt.value as 'low' | 'medium' | 'urgent')}
                className="flex-1 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 transition-all"
                style={{
                  background: isActive ? opt.activeBg : '#fff',
                  border: `1.5px solid ${isActive ? opt.activeBorder : '#EDE0D0'}`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: opt.dot }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? opt.activeText : '#A8937A' }}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Options */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>
          Options
        </p>
        <div className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 mb-7"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEF2F2', color: '#DC2626' }}>
            <AlertTriangle size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>
              Problème bloquant
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
              Le logement ne peut pas être livré
            </p>
          </div>
          <Toggle
            label=""
            checked={isBlocking}
            onChange={setIsBlocking}
          />
        </div>

        {/* Description */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>
          Description (optionnelle)
        </p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Décrivez le problème en détail…"
          className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none resize-none"
          style={{
            background: '#fff',
            border: '1px solid #EDE0D0',
            color: '#2C1F0E',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />

      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all"
          style={{
            background: canSubmit ? '#DC2626' : '#EDE0D0',
            color: canSubmit ? '#fff' : '#C4A882',
          }}
        >
          {saving
            ? <Spinner size={20} />
            : <AlertTriangle size={18} />
          }
          {saving ? 'Envoi…' : 'Signaler le problème'}
        </button>
      </div>

    </div>
  )
}
