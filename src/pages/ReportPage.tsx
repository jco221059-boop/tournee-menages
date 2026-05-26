// PAGE: ReportPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, carte hero colorée selon statut.
// 3 stats (réalisées / passées / anomalies). Liste anomalies avec badge urgence.
// Étapes passées avec raison. Grille photos 3 colonnes. Tâches avec pièce + note.

import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { ArrowLeft, Clock, SkipForward } from 'lucide-react'
import { Spinner } from '../components/ui'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const FINAL_STATUS_CONFIG = {
  ready: {
    emoji: '✅',
    label: 'Logement prêt',
    bg: '#EEF4EF',
    border: '#B5D4BA',
    textColor: '#2C4A30',
  },
  ready_with_note: {
    emoji: '⚠️',
    label: 'Prêt avec remarques',
    bg: '#FFFBF0',
    border: '#FDE68A',
    textColor: '#78350F',
  },
  not_ready: {
    emoji: '❌',
    label: 'Non prêt',
    bg: '#FEF2F2',
    border: '#FECACA',
    textColor: '#7F1D1D',
  },
}

const URGENCY_CONFIG = {
  low:    { bg: '#EEF4EF', color: '#2C4A30', border: '#B5D4BA', dot: '#6B9E78' },
  medium: { bg: '#FEF3C7', color: '#78350F', border: '#FDE68A', dot: '#D97706' },
  urgent: { bg: '#FEF2F2', color: '#7F1D1D', border: '#FECACA', dot: '#DC2626' },
}

export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { missions, fetchMission } = useAppStore()

  useEffect(() => { fetchMission?.(id!) }, [id])

  const mission = missions.find(m => m.id === id)
  const report = mission?.report

  if (!mission || !report) return (
    <div className="flex items-center justify-center h-full" style={{ background: '#FAF7F2' }}>
      <Spinner size={28} />
    </div>
  )

  const statusCfg = FINAL_STATUS_CONFIG[report.final_status as keyof typeof FINAL_STATUS_CONFIG]
    ?? FINAL_STATUS_CONFIG.ready

  const steps = mission.steps ?? []
  const completedSteps = steps.filter(s => s.status === 'completed')
  const skippedSteps = steps.filter(s => s.status === 'skipped')
  const anomalies = mission.anomalies ?? []
  const photos = mission.photos ?? []

  const formattedDate = mission.scheduled_date
    ? format(parseISO(mission.scheduled_date), 'd MMMM yyyy', { locale: fr })
    : ''

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
          <h1 className="text-lg font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
            Rapport de ménage
          </h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#A8937A' }}>
            {mission.property?.name}
          </p>
        </div>
      </div>

      <div className="scroll-area px-5 pb-8">

        {/* Hero card */}
        <div
          className="rounded-3xl p-6 flex flex-col items-center text-center mb-4"
          style={{ background: statusCfg.bg, border: `1.5px solid ${statusCfg.border}` }}
        >
          <span className="text-5xl mb-3 leading-none">{statusCfg.emoji}</span>
          <h2 className="text-xl font-bold mb-1"
            style={{ color: statusCfg.textColor, letterSpacing: '-0.02em' }}>
            {statusCfg.label}
          </h2>
          <p className="text-sm mb-3" style={{ color: statusCfg.textColor, opacity: 0.8 }}>
            {mission.property?.name} · {formattedDate}
          </p>
          {report.duration_min && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold"
              style={{ background: '#fff', border: `1px solid ${statusCfg.border}`, color: statusCfg.textColor }}>
              <Clock size={14} />
              {report.duration_min >= 60
                ? `${Math.floor(report.duration_min / 60)}h ${report.duration_min % 60} min`
                : `${report.duration_min} min`}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-6">
          {[
            { val: report.steps_completed ?? completedSteps.length, lbl: 'Réalisées', color: '#6B9E78' },
            { val: report.steps_total - (report.steps_completed ?? 0), lbl: 'Passées',   color: '#C4A882' },
            { val: report.anomalies_count ?? anomalies.length,       lbl: 'Anomalies',  color: '#DC2626' },
          ].map(s => (
            <div key={s.lbl} className="flex-1 rounded-2xl py-3 text-center"
              style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
              <div className="text-2xl font-bold" style={{ color: s.color, letterSpacing: '-0.03em' }}>
                {s.val}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: '#C4A882' }}>
                {s.lbl}
              </div>
            </div>
          ))}
        </div>

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
              style={{ color: '#C4A882' }}>
              Anomalies
            </p>
            <div className="flex flex-col gap-2">
              {anomalies.map(anomaly => {
                const urgCfg = URGENCY_CONFIG[anomaly.urgency as keyof typeof URGENCY_CONFIG]
                  ?? URGENCY_CONFIG.medium
                return (
                  <div key={anomaly.id}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{
                      background: '#fff',
                      border: '1px solid #EDE0D0',
                      borderLeft: `3px solid ${urgCfg.dot}`,
                    }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: urgCfg.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>
                        {anomaly.anomaly_type}
                      </p>
                      {(anomaly.room || anomaly.comment) && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#A8937A' }}>
                          {[anomaly.room?.name, anomaly.comment].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: urgCfg.bg, color: urgCfg.color, border: `1px solid ${urgCfg.border}` }}>
                      {anomaly.urgency === 'low' ? 'Faible'
                        : anomaly.urgency === 'medium' ? 'Moyenne' : 'Urgent'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Étapes passées */}
        {skippedSteps.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
              style={{ color: '#C4A882' }}>
              Étapes passées
            </p>
            <div className="flex flex-col gap-2">
              {skippedSteps.map(step => (
                <div key={step.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F5F0EA', color: '#C4A882' }}>
                    <SkipForward size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#2C1F0E' }}>
                      {step.task?.title}
                    </p>
                    {step.skip_reason && (
                      <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                        {step.skip_reason}
                      </p>
                    )}
                  </div>
                  {step.room && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: '#F5F0EA', color: '#A8937A' }}>
                      {step.room.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest pl-0.5"
                style={{ color: '#C4A882' }}>
                Photos ({photos.length})
              </p>
              <p className="text-xs" style={{ color: '#A8937A' }}>
                {formattedDate}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.slice(0, 6).map((photo, i) => {
                const isExtra = i === 5 && photos.length > 6
                return (
                  <div
                    key={photo.id}
                    className="relative rounded-xl overflow-hidden flex items-center justify-center cursor-pointer"
                    style={{
                      aspectRatio: '1',
                      background: '#EDE0D0',
                      border: '1px solid #EDE0D0',
                    }}
                    onClick={() => !isExtra && window.open(photo.url, '_blank')}
                  >
                    {photo.url && !isExtra ? (
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    ) : isExtra ? (
                      <span className="text-sm font-bold" style={{ color: '#A8937A' }}>
                        +{photos.length - 5}
                      </span>
                    ) : (
                      <span className="text-xl">📷</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tâches réalisées */}
        {completedSteps.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
              style={{ color: '#C4A882' }}>
              Tâches réalisées
            </p>
            <div className="flex flex-col gap-2">
              {completedSteps.map(step => (
                <div key={step.id}
                  className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
                  style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#6B9E78' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#2C1F0E' }}>
                      {step.task?.title}
                    </p>
                    {step.comment && (
                      <p className="text-xs mt-0.5 italic" style={{ color: '#6B9E78' }}>
                        {step.comment}
                      </p>
                    )}
                  </div>
                  {step.room && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: '#F5F0EA', color: '#A8937A' }}>
                      {step.room.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
