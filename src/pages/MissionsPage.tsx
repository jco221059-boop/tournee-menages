// PAGE: MissionsPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches, accents vert sauge.
// Barre de stats rapides (À faire / En cours / Terminé) ajoutée sous le header.
// Bandeau "Mission en cours" avec dot pulsant.
// Cartes avec accent coloré sur le bord gauche selon statut.
// Compteur de missions par section. Jours vides avec message discret.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, MapPin, Clock, AlertCircle, CheckCircle2, Home } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { EmptyState, Spinner } from '../components/ui'
import type { Mission } from '../types'

function dayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return "Aujourd'hui"
  if (isTomorrow(d)) return 'Demain'
  return format(d, 'EEEE d MMMM', { locale: fr })
}

function statusConfig(status: Mission['status']) {
  return {
    pending:     { label: 'À faire',  accent: '#EDE0D0', badgeBg: '#F5F0EA', badgeColor: '#7C6040', badgeBorder: '#EDE0D0', dot: '#EDE0D0', dotPulse: false },
    in_progress: { label: 'En cours', accent: '#D97706', badgeBg: '#FEF3C7', badgeColor: '#78350F', badgeBorder: '#FDE68A', dot: '#D97706', dotPulse: true },
    completed:   { label: 'Terminé',  accent: '#6B9E78', badgeBg: '#EEF4EF', badgeColor: '#2C4A30', badgeBorder: '#B5D4BA', dot: '#6B9E78', dotPulse: false },
    problem:     { label: 'Problème', accent: '#DC2626', badgeBg: '#FEF2F2', badgeColor: '#7F1D1D', badgeBorder: '#FECACA', dot: '#DC2626', dotPulse: false },
  }[status]
}

function MissionCard({ mission }: { mission: Mission }) {
  const navigate = useNavigate()
  const cfg = statusConfig(mission.status)
  const isCompleted = mission.status === 'completed'

  return (
    <div
      onClick={() => navigate(`/missions/${mission.id}`)}
      className="relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform mb-2.5"
      style={{
        background: '#fff',
        border: '1px solid #EDE0D0',
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      {/* Accent gauche */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: cfg.accent }} />

      <div className="flex items-start gap-3 pl-4 pr-4 py-3.5">
        {/* Icône statut */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: cfg.badgeBg,
            color: cfg.badgeColor,
          }}>
          {mission.status === 'completed'
            ? <CheckCircle2 size={18} />
            : mission.status === 'problem'
              ? <AlertCircle size={18} />
              : <Home size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate" style={{ color: '#2C1F0E' }}>
              {mission.property?.name ?? 'Logement'}
            </h3>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: cfg.badgeBg,
                color: cfg.badgeColor,
                border: `1px solid ${cfg.badgeBorder}`,
              }}>
              {cfg.label}
            </span>
          </div>

          {mission.property?.address && (
            <div className="flex items-center gap-1 text-xs mb-1.5" style={{ color: '#C4A882' }}>
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{mission.property.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#A8937A' }}>
            {mission.scheduled_time && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: cfg.dot,
                    animation: cfg.dotPulse ? 'pulse 1.8s ease-in-out infinite' : undefined,
                  }}
                />
                <Clock size={10} />
                {mission.scheduled_time.slice(0, 5)}
              </span>
            )}
            {mission.checkin_time && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: '#FEF3C7', color: '#78350F', border: '1px solid #FDE68A' }}>
                ⚡ Check-in {mission.checkin_time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MissionsPage() {
  const navigate = useNavigate()
  const { missions, fetchMissions, loading } = useAppStore()
  useEffect(() => { fetchMissions() }, [])

  const today = format(new Date(), 'yyyy-MM-dd')
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))

  const grouped = dates.reduce((acc, d) => {
    const list = missions.filter(m => m.scheduled_date === d)
    if (list.length > 0 || d === today) acc[d] = list
    return acc
  }, {} as Record<string, Mission[]>)

  const todayMissions = missions.filter(m => m.scheduled_date === today)
  const inProgress = todayMissions.find(m => m.status === 'in_progress')

  // Stats
  const allVisible = Object.values(grouped).flat()
  const countTodo = allVisible.filter(m => m.status === 'pending').length
  const countInProgress = allVisible.filter(m => m.status === 'in_progress').length
  const countDone = allVisible.filter(m => m.status === 'completed').length

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: '#C4A882' }}>
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </p>
            <h1 className="text-3xl font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.025em' }}>
              Missions
            </h1>
          </div>
          <button
            onClick={() => navigate('/missions/new')}
            className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-full mt-2 active:scale-[0.97] transition-transform"
            style={{ background: '#6B9E78' }}
          >
            <Plus size={15} />
            Nouvelle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 px-5 pt-4 pb-0 flex-shrink-0">
        {[
          { val: countTodo,       lbl: 'À faire',  color: '#C4A882' },
          { val: countInProgress, lbl: 'En cours',  color: '#D97706' },
          { val: countDone,       lbl: 'Terminé',   color: '#6B9E78' },
        ].map(s => (
          <div key={s.lbl} className="flex-1 rounded-2xl py-2.5 text-center"
            style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
            <div className="text-xl font-bold" style={{ color: s.color, letterSpacing: '-0.03em' }}>
              {s.val}
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: '#C4A882' }}>
              {s.lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Bandeau mission en cours */}
      {inProgress && (
        <div
          onClick={() => navigate(`/missions/${inProgress.id}/steps`)}
          className="mx-5 mt-4 flex-shrink-0 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          style={{ background: '#EEF4EF', border: '1px solid #B5D4BA' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#6B9E78' }}>
            <div className="w-2.5 h-2.5 bg-white rounded-full"
              style={{ animation: 'pulse 1.8s ease-in-out infinite' }} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6B9E78' }}>
              Mission en cours
            </p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#2C4A30' }}>
              {inProgress.property?.name}
            </p>
          </div>
          <span className="text-xs font-bold" style={{ color: '#6B9E78' }}>Reprendre →</span>
        </div>
      )}

      {/* Liste */}
      <div className="scroll-area px-5 pt-5 pb-5">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState
            icon={<Home size={48} />}
            title="Aucune mission"
            subtitle="Créez votre première mission ou configurez un logement."
            action={
              <button
                onClick={() => navigate('/missions/new')}
                className="text-white text-sm font-bold px-4 py-2 rounded-full"
                style={{ background: '#6B9E78' }}
              >
                Créer une mission
              </button>
            }
          />
        ) : (
          Object.entries(grouped).map(([date, list]) => (
            <div key={date} className="mb-6">
              {/* Section header */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#C4A882' }}>
                  {dayLabel(date)}
                </span>
                {list.length > 0 && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: '#EDE0D0', color: '#C4A882' }}>
                    {list.length} mission{list.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {list.length === 0 ? (
                <div className="flex items-center gap-2 py-2.5 px-1 text-xs" style={{ color: '#C4A882' }}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ border: '1.5px solid #EDE0D0' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.8 1.8L6.5 2" stroke="#EDE0D0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  Aucune mission ce jour
                </div>
              ) : (
                list.map(m => <MissionCard key={m.id} mission={m} />)
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  )
}
