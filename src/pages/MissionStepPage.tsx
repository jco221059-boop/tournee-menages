// PAGE: MissionStepPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, immersif et épuré.
// Titre tâche en très grand. Barre de progression fine en haut.
// Photo référence en card beige. Lien vidéo en card ambre.
// Deux CTA distincts : photo (teal) + fait (blanc contouré).
// États : étape normale, photo fin de pièce, toutes faites, sans étapes.

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, MoreHorizontal, Camera, Check, AlertTriangle, ChevronRight, ExternalLink, Play } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { BottomSheet, Spinner } from '../components/ui'
import type { MissionStep } from '../types'

export default function MissionStepPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    missions, completeStep, skipStep, addStepNote,
    takeStepPhoto, fetchMission,
  } = useAppStore()

  const [showMenu, setShowMenu] = useState(false)
  const [showSkipSheet, setShowSkipSheet] = useState(false)
  const [showNoteSheet, setShowNoteSheet] = useState(false)
  const [showAllSteps, setShowAllSteps] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [note, setNote] = useState('')
  const [completing, setCompleting] = useState(false)

  useEffect(() => { fetchMission?.(id!) }, [id])

  const mission = missions.find(m => m.id === id)
  if (!mission) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
      <Spinner size={28} />
    </div>
  )

  const steps = mission.steps ?? []
  const totalSteps = steps.length
  const currentStepIndex = steps.findIndex(s => s.status === 'pending')
  const allDone = currentStepIndex === -1
  const noSteps = totalSteps === 0

  // État : photo fin de pièce
  const prevStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null
  const currentStep = steps[currentStepIndex]
  const nextStep = currentStepIndex < totalSteps - 1 ? steps[currentStepIndex + 1] : null
  const isRoomEnd = prevStep && nextStep && prevStep.room_id !== nextStep?.room_id
    && currentStep?.task?.task_type !== 'photo'

  const doneCount = steps.filter(s => s.status === 'completed').length
  const progress = totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0
  const anomalyCount = mission.anomalies?.length ?? 0

  const handleComplete = async () => {
    if (!currentStep) return
    setCompleting(true)
    await completeStep(currentStep.id)
    setCompleting(false)
  }

  const handlePhoto = async () => {
    if (!currentStep) return
    await takeStepPhoto?.(currentStep.id)
  }

  const handleSkip = async () => {
    if (!currentStep || !skipReason) return
    await skipStep(currentStep.id, skipReason)
    setShowSkipSheet(false)
    setSkipReason('')
  }

  const handleNote = async () => {
    if (!currentStep || !note.trim()) return
    await addStepNote?.(currentStep.id, note.trim())
    setShowNoteSheet(false)
    setNote('')
  }

  const skipReasons = [
    'Produit non disponible',
    'Déjà fait',
    'Non applicable',
    'Manque de temps',
    'Autre',
  ]

  // ── État : sans étapes ──
  if (noSteps) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center"
        style={{ background: '#FAF7F2' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
          style={{ background: '#F5F0EA' }}>
          📋
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#2C1F0E' }}>
          Aucune étape dans ce workflow
        </h2>
        <p className="text-sm mb-6" style={{ color: '#A8937A' }}>
          Ajoutez des tâches au workflow pour guider le ménage.
        </p>
        <button
          onClick={() => navigate(`/missions/${id}`)}
          className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
          style={{ background: '#6B9E78' }}
        >
          Retour à la mission
        </button>
      </div>
    )
  }

  // ── État : toutes les étapes faites ──
  if (allDone) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>
        <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0">
          <button
            onClick={() => navigate(`/missions/${id}`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            Toutes les étapes sont faites !
          </h2>
          <p className="text-sm mb-8" style={{ color: '#A8937A' }}>
            Vous pouvez maintenant finaliser la mission.
          </p>
          <button
            onClick={() => navigate(`/missions/${id}/final`)}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#6B9E78' }}
          >
            Passer à la fermeture finale →
          </button>
        </div>
      </div>
    )
  }

  // ── État : photo fin de pièce ──
  if (isRoomEnd && prevStep?.room) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>
        <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0">
          <button
            onClick={() => navigate(`/missions/${id}`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
          >
            <X size={18} />
          </button>
          <span className="text-sm font-semibold" style={{ color: '#A8937A' }}>
            Fin de pièce
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 text-3xl"
            style={{ background: '#EEF4EF', border: '1px solid #B5D4BA' }}>
            🏠
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            {prevStep.room.name}
          </h2>
          <p className="text-sm mb-8" style={{ color: '#A8937A', lineHeight: 1.6 }}>
            Prenez une photo de la pièce terminée avant de passer à la suivante.
          </p>
        </div>
        <div className="px-5 pb-8"
          style={{ borderTop: '1px solid #EDE0D0', paddingTop: 14, background: 'rgba(250,247,242,0.97)' }}>
          <button
            onClick={handleComplete}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#0D9488' }}
          >
            <Camera size={18} />
            Photo de fin de {prevStep.room.name}
          </button>
        </div>
      </div>
    )
  }

  // ── État principal ──
  const task = currentStep?.task
  const isPhotoTask = task?.task_type === 'photo' || task?.photo_required

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0">
        <button
          onClick={() => navigate(`/missions/${id}`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
        >
          <X size={18} />
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-semibold" style={{ color: '#C4A882' }}>
            <span>Étape {doneCount + 1} sur {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EDE0D0' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: '#6B9E78' }}
            />
          </div>
        </div>

        <button
          onClick={() => setShowMenu(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="scroll-area px-5 pb-5">

        {/* Room chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
          style={{ background: '#F5F0EA', border: '1px solid #EDE0D0' }}>
          <RoomIcon type={currentStep?.room?.room_type} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>
            {currentStep?.room?.name ?? 'Pièce'}
          </span>
        </div>

        {/* Step counter */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6B9E78' }} />
          <span className="text-xs font-bold" style={{ color: '#6B9E78', letterSpacing: '0.04em' }}>
            Étape {doneCount + 1} / {totalSteps}
          </span>
        </div>

        {/* Task title */}
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#2C1F0E', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          {task?.title ?? 'Étape'}
        </h1>

        {/* Description */}
        {task?.description && (
          <p className="text-sm mb-5" style={{ color: '#A8937A', lineHeight: 1.6 }}>
            {task.description}
          </p>
        )}

        {/* Photo référence */}
        {task?.photo_required && (
          <div className="rounded-2xl overflow-hidden mb-5"
            style={{ background: '#F5F0EA', border: '1px solid #EDE0D0' }}>
            <div className="h-40 flex flex-col items-center justify-center gap-2"
              style={{ color: '#C4A882' }}>
              <Camera size={32} />
              <span className="text-xs font-semibold tracking-wider uppercase">
                Photo de référence
              </span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2"
              style={{ background: '#EDE0D0', color: '#A8937A' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6.5 5.5v4M6.5 4v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-xs font-semibold">Résultat attendu après nettoyage</span>
            </div>
          </div>
        )}

        {/* Lien vidéo */}
        {task?.video_url && (
          <div
            className="flex items-center gap-3 rounded-2xl p-3.5 mb-5 cursor-pointer"
            style={{ background: '#fff', border: '1px solid #EDE0D0' }}
            onClick={() => window.open(task.video_url!, '_blank')}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Play size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>
                Voir comment faire
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                Tutoriel vidéo
              </p>
            </div>
            <ExternalLink size={16} style={{ color: '#D5C4AF' }} />
          </div>
        )}

        {/* Compteur anomalies */}
        {anomalyCount > 0 && (
          <div
            className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-5 cursor-pointer"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            onClick={() => navigate(`/missions/${id}/anomaly`)}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#DC2626' }} />
            <p className="text-xs font-semibold flex-1" style={{ color: '#7F1D1D' }}>
              {anomalyCount} anomalie{anomalyCount > 1 ? 's' : ''} signalée{anomalyCount > 1 ? 's' : ''}
            </p>
            <ChevronRight size={14} style={{ color: '#DC2626' }} />
          </div>
        )}

        {/* Lien signaler problème */}
        <div className="text-center py-1">
          <button
            onClick={() => navigate(`/missions/${id}/anomaly`)}
            className="text-xs"
            style={{ color: '#C4A882' }}
          >
            <span style={{ color: '#D97706', fontWeight: 600 }}>
              ⚠ Signaler un problème
            </span>
          </button>
        </div>

      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3.5 pb-8 flex flex-col gap-2.5"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        {isPhotoTask && (
          <button
            onClick={handlePhoto}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#0D9488' }}
          >
            <Camera size={18} />
            Prendre la photo
          </button>
        )}
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
          style={{
            background: isPhotoTask ? '#fff' : '#6B9E78',
            color: isPhotoTask ? '#6B9E78' : '#fff',
            border: isPhotoTask ? '1.5px solid #B5D4BA' : 'none',
          }}
        >
          {completing ? <Spinner size={18} /> : <Check size={18} />}
          {completing ? 'Validation…' : 'Marquer comme fait'}
        </button>
      </div>

      {/* Menu ··· */}
      <BottomSheet open={showMenu} onClose={() => setShowMenu(false)} title="Options">
        <div className="flex flex-col gap-2 pb-2">
          <button
            onClick={() => { setShowMenu(false); setShowAllSteps(true) }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
            style={{ background: '#F5F0EA' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>
              Voir toutes les étapes
            </span>
          </button>
          {task?.can_skip && (
            <button
              onClick={() => { setShowMenu(false); setShowSkipSheet(true) }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
              style={{ background: '#F5F0EA' }}
            >
              <span className="text-sm font-semibold" style={{ color: '#D97706' }}>
                Passer cette étape
              </span>
            </button>
          )}
          <button
            onClick={() => { setShowMenu(false); navigate(`/missions/${id}/anomaly`) }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
            style={{ background: '#FEF2F2' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>
              Signaler un problème
            </span>
          </button>
          <button
            onClick={() => { setShowMenu(false); setShowNoteSheet(true) }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
            style={{ background: '#F5F0EA' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>
              Ajouter une note
            </span>
          </button>
        </div>
      </BottomSheet>

      {/* Skip sheet */}
      <BottomSheet open={showSkipSheet} onClose={() => setShowSkipSheet(false)} title="Passer cette étape">
        <p className="text-xs mb-3" style={{ color: '#A8937A' }}>Raison du passage :</p>
        <div className="flex flex-col gap-2 mb-5">
          {skipReasons.map(r => (
            <button
              key={r}
              onClick={() => setSkipReason(r)}
              className="px-4 py-3 rounded-2xl text-left text-sm font-medium transition-all"
              style={{
                background: skipReason === r ? '#EEF4EF' : '#F5F0EA',
                border: `1.5px solid ${skipReason === r ? '#6B9E78' : '#EDE0D0'}`,
                color: skipReason === r ? '#2C4A30' : '#2C1F0E',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={handleSkip}
          disabled={!skipReason}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: skipReason ? '#D97706' : '#EDE0D0', color: skipReason ? '#fff' : '#C4A882' }}
        >
          Confirmer le passage
        </button>
      </BottomSheet>

      {/* Note sheet */}
      <BottomSheet open={showNoteSheet} onClose={() => setShowNoteSheet(false)} title="Ajouter une note">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          placeholder="Votre remarque sur cette étape…"
          className="w-full rounded-2xl px-4 py-3.5 text-sm mb-4 outline-none resize-none"
          style={{
            background: '#F5F0EA', border: '1px solid #EDE0D0',
            color: '#2C1F0E', fontFamily: 'inherit', lineHeight: 1.6,
          }}
        />
        <button
          onClick={handleNote}
          disabled={!note.trim()}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: note.trim() ? '#6B9E78' : '#EDE0D0', color: note.trim() ? '#fff' : '#C4A882' }}
        >
          Valider la note
        </button>
      </BottomSheet>

      {/* All steps sheet */}
      <BottomSheet open={showAllSteps} onClose={() => setShowAllSteps(false)} title="Toutes les étapes">
        <div className="scroll-area max-h-96">
          {steps.map((step, i) => {
            const isDone = step.status === 'completed'
            const isSkipped = step.status === 'skipped'
            const isCurrent = step.id === currentStep?.id
            return (
              <div
                key={step.id}
                onClick={() => { setShowAllSteps(false) }}
                className="flex items-center gap-2.5 px-0 py-2.5 cursor-pointer"
                style={{ borderBottom: i < steps.length - 1 ? '1px solid #F5F0EA' : 'none' }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isDone ? '#6B9E78' : isSkipped ? '#EDE0D0' : isCurrent ? '#fff' : 'transparent',
                    border: isCurrent ? '2px solid #6B9E78' : isDone ? 'none' : '1.5px solid #EDE0D0',
                  }}>
                  {isDone
                    ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    : <span className="text-[9px] font-bold" style={{ color: isCurrent ? '#6B9E78' : '#C4A882' }}>
                        {i + 1}
                      </span>
                  }
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#F5F0EA', color: '#A8937A' }}>
                  {step.room?.name}
                </span>
                <span className="text-sm flex-1 truncate"
                  style={{
                    color: isDone || isSkipped ? '#C4A882' : '#2C1F0E',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                  {step.task?.title}
                </span>
              </div>
            )
          })}
        </div>
      </BottomSheet>

    </div>
  )
}

function RoomIcon({ type }: { type?: string }) {
  const icons: Record<string, string> = {
    entrance: '🚪', bedroom: '🛏', bathroom: '🛁', wc: '🚿',
    kitchen: '🍳', living: '🛋', balcony: '🌿', terrace: '🌿',
    laundry: '🧺', garage: '🚗', other: '📦',
  }
  return <span style={{ fontSize: 13 }}>{icons[type ?? 'other'] ?? '📦'}</span>
}
