// PAGE: MissionDetailPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches groupées par thème.
// Bandeau statut coloré avec progression. Codes d'accès en pill monospace.
// Aperçu étapes avec barré/grisé pour les faites. CTA ambre si en cours, vert si pending.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft, Trash2, Lock, Box, StickyNote,
  MapPin, GitBranch, CheckCircle2, AlertCircle,
  ChevronRight, FileText
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { BottomSheet, Spinner } from '../components/ui'
import type { Mission } from '../types'

function StatusBanner({ mission, stepsTotal, stepsDone }: {
  mission: Mission
  stepsTotal: number
  stepsDone: number
}) {
  const configs = {
    pending:     { bg: '#F5F0EA', border: '#EDE0D0', dot: '#C4A882', pulse: false, label: 'À faire',  textColor: '#7C6040' },
    in_progress: { bg: '#FEF3C7', border: '#FDE68A', dot: '#D97706', pulse: true,  label: 'En cours', textColor: '#78350F' },
    completed:   { bg: '#EEF4EF', border: '#B5D4BA', dot: '#6B9E78', pulse: false, label: 'Terminé',  textColor: '#2C4A30' },
    problem:     { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', pulse: false, label: 'Problème', textColor: '#7F1D1D' },
  }
  const cfg = configs[mission.status]

  return (
    <div className="mx-5 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{
          background: cfg.dot,
          animation: cfg.pulse ? 'pulse 1.8s ease-in-out infinite' : undefined,
        }}
      />
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: cfg.textColor }}>{cfg.label}</p>
        {mission.status === 'in_progress' && stepsTotal > 0 && (
          <p className="text-xs mt-0.5" style={{ color: cfg.dot }}>
            {stepsDone} étape{stepsDone > 1 ? 's' : ''} complétée{stepsDone > 1 ? 's' : ''}
          </p>
        )}
      </div>
      {mission.status === 'in_progress' && stepsTotal > 0 && (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: '#fff', border: `1px solid ${cfg.border}`, color: cfg.textColor }}>
          {stepsDone} / {stepsTotal}
        </span>
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, iconBg, iconColor, title, children }: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-3"
      style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3"
        style={{ borderBottom: '1px solid #F5F0EA' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, code }: { label: string; value?: string | null; code?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 px-4 py-2.5"
      style={{ borderBottom: '1px solid #F5F0EA' }}>
      <span className="text-xs flex-shrink-0 pt-0.5" style={{ color: '#C4A882', width: 80 }}>
        {label}
      </span>
      {code ? (
        <span className="text-sm font-bold px-2 py-0.5 rounded-lg"
          style={{ fontFamily: 'monospace', background: '#F5F0EA', color: '#2C1F0E', letterSpacing: '0.08em' }}>
          {value}
        </span>
      ) : (
        <span className="text-sm font-medium flex-1" style={{ color: '#2C1F0E' }}>{value}</span>
      )}
    </div>
  )
}

export default function MissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getMission, deleteMission, missions, workflows, fetchMissions } = useAppStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showWorkflowSheet, setShowWorkflowSheet] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchMissions() }, [])

  const mission = missions.find(m => m.id === id)
  if (!mission) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
      <Spinner size={28} />
    </div>
  )

  const property = mission.property
  const steps = mission.steps ?? []
  const stepsTotal = steps.length
  const stepsDone = steps.filter(s => s.status === 'completed').length
  const previewSteps = steps.slice(0, 5)

  const handleDelete = async () => {
    setDeleting(true)
    await deleteMission(id!)
    setDeleting(false)
    navigate('/missions')
  }

  const formattedDate = mission.scheduled_date
    ? format(parseISO(mission.scheduled_date), 'EEEE d MMMM', { locale: fr })
    : ''

  // Pièces dans l'ordre pour navigation carrousel
  const orderedRooms = (mission.property?.rooms ?? [])
    .filter(r => steps.some(s => s.room_id === r.id))
    .sort((a, b) => a.order_index - b.order_index)

  const firstRoom = orderedRooms[0]

  // Pour "Reprendre" : trouver la pièce en cours via room_progress
  const roomProgress = (mission as any).room_progress ?? []
  const inProgressRoomId = (() => {
    for (const r of orderedRooms) {
      const prog = roomProgress.find((p: any) => p.room_id === r.id)
      if (!prog || (!prog.tasks_completed && !prog.photos_completed)) return r.id
      if (prog.tasks_completed && !prog.photos_completed) return r.id
    }
    return firstRoom?.id
  })()

  const ctaLabel = mission.status === 'pending' ? 'Commencer le ménage'
    : mission.status === 'in_progress' ? 'Reprendre la mission'
    : null

  const ctaRoute = mission.status === 'pending'
    ? (firstRoom ? `/missions/${id}/rooms/${firstRoom.id}/tasks` : `/missions/${id}/preview`)
    : `/missions/${id}/rooms/${inProgressRoomId ?? firstRoom?.id}/tasks`

  const ctaBg = mission.status === 'in_progress' ? '#D97706' : '#6B9E78'

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0">
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
            {property?.name ?? 'Mission'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
            {formattedDate}{mission.scheduled_time ? ` · ${mission.scheduled_time.slice(0, 5)}` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* Status banner */}
      <StatusBanner mission={mission} stepsTotal={stepsTotal} stepsDone={stepsDone} />

      <div className="scroll-area px-5 pb-5">

        {/* Workflow */}
        {mission.workflow_id ? (
          <div
            onClick={() => navigate(`/config/workflows/${mission.workflow_id}`)}
            className="flex items-center gap-3 rounded-2xl p-3.5 mb-3 cursor-pointer"
            style={{ background: '#fff', border: '1px solid #EDE0D0' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#DCFCE7', color: '#6B9E78' }}>
              <GitBranch size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#2C1F0E' }}>
                {workflows.find(w => w.id === mission.workflow_id)?.name ?? 'Workflow'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                {stepsTotal} étapes
              </p>
            </div>
            <span className="text-xs font-semibold" style={{ color: '#6B9E78' }}>Voir →</span>
          </div>
        ) : (
          <div
            onClick={() => setShowWorkflowSheet(true)}
            className="flex items-center gap-3 rounded-2xl p-3.5 mb-3 cursor-pointer"
            style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#D97706', color: '#fff' }}>
              <AlertCircle size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#78350F' }}>
                Aucun workflow assigné
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#D97706' }}>
                Appuyer pour assigner un workflow
              </p>
            </div>
            <ChevronRight size={16} style={{ color: '#D97706' }} />
          </div>
        )}

        {/* Accès */}
        {(property?.address || property?.building_code || property?.door_code || property?.key_box) && (
          <InfoCard icon={Lock} iconBg="#CCFBF1" iconColor="#0D9488" title="Accès">
            <InfoRow label="Adresse" value={property?.address} />
            <InfoRow label="Immeuble" value={property?.building_code} code />
            <InfoRow label="Porte" value={property?.door_code} code />
            <InfoRow label="Boîte à clés" value={property?.key_box} />
            <div style={{ borderBottom: 'none' }}>
              <InfoRow label="Consignes" value={property?.key_instructions} />
            </div>
          </InfoCard>
        )}

        {/* Matériel */}
        {(property?.linen_location || property?.products_location || property?.trash_location) && (
          <InfoCard icon={Box} iconBg="#DCFCE7" iconColor="#6B9E78" title="Matériel">
            <InfoRow label="Linge propre" value={property?.linen_location} />
            <InfoRow label="Linge sale" value={property?.dirty_linen_location} />
            <InfoRow label="Produits" value={property?.products_location} />
            <div style={{ borderBottom: 'none' }}>
              <InfoRow label="Poubelles" value={property?.trash_location} />
            </div>
          </InfoCard>
        )}

        {/* Notes */}
        {(mission.notes || property?.notes) && (
          <InfoCard icon={StickyNote} iconBg="#F5F0EA" iconColor="#C4A882" title="Notes">
            <div className="px-4 py-3 text-sm" style={{ color: '#2C1F0E', lineHeight: 1.6 }}>
              {mission.notes || property?.notes}
            </div>
          </InfoCard>
        )}

        {/* Aperçu étapes */}
        {stepsTotal > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>
                Aperçu des étapes
              </span>
              <button
                onClick={() => navigate(`/missions/${id}/preview`)}
                className="text-xs font-semibold"
                style={{ color: '#6B9E78' }}
              >
                Voir toutes →
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {previewSteps.map((step, i) => {
                const isDone = step.status === 'completed'
                return (
                  <div key={step.id}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                    style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isDone ? '#6B9E78' : 'transparent',
                        border: isDone ? 'none' : '1.5px solid #EDE0D0',
                      }}>
                      {isDone
                        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        : <span className="text-[9px] font-bold" style={{ color: '#C4A882' }}>{i + 1}</span>
                      }
                    </div>
                    <span
                      className="text-xs font-medium flex-shrink-0 px-1.5 py-0.5 rounded-full"
                      style={{ background: '#F5F0EA', color: '#A8937A' }}>
                      {step.room?.name ?? ''}
                    </span>
                    <span
                      className="text-sm flex-1 truncate"
                      style={{
                        color: isDone ? '#C4A882' : '#2C1F0E',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>
                      {step.task?.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rapport final si terminé */}
        {mission.status === 'completed' && (
          <button
            onClick={() => navigate(`/missions/${id}/report`)}
            className="w-full flex items-center gap-3 rounded-2xl p-3.5 mt-1 mb-3"
            style={{ background: '#EEF4EF', border: '1px solid #B5D4BA' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#6B9E78', color: '#fff' }}>
              <FileText size={17} />
            </div>
            <span className="text-sm font-semibold flex-1 text-left" style={{ color: '#2C4A30' }}>
              Voir le rapport final
            </span>
            <ChevronRight size={16} style={{ color: '#6B9E78' }} />
          </button>
        )}

      </div>

      {/* CTA fixe */}
      {ctaLabel && (
        <div className="flex-shrink-0 px-5 pt-3.5 pb-8"
          style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
          <button
            onClick={() => navigate(ctaRoute!)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: ctaBg }}
          >
            {ctaLabel}
          </button>
        </div>
      )}

      {/* Delete confirm sheet */}
      <BottomSheet
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer la mission ?"
      >
        <p className="text-sm mb-5" style={{ color: '#A8937A' }}>
          Cette action est irréversible. Toutes les étapes et photos seront supprimées.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: '#F5F0EA', color: '#A8937A' }}
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#DC2626' }}
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </BottomSheet>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>

    </div>
  )
}
