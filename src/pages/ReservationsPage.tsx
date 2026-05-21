import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isPast, isFuture, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, Calendar, Users, Trash2, ChevronRight, Filter } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PageHeader, Badge, Button, EmptyState, Spinner } from '../components/ui'
import type { Reservation, ReservationStatus } from '../types'
import clsx from 'clsx'

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cleaning_needed: 'Ménage requis',
  cleaned: 'Ménage fait',
  cancelled: 'Annulée',
}

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'warning',
  confirmed: 'primary',
  cleaning_needed: 'danger',
  cleaned: 'success',
  cancelled: 'default',
}

const PLATFORM_ICONS: Record<string, string> = {
  airbnb: '🏠',
  booking: '🔵',
  direct: '✉️',
  other: '📋',
}

export default function ReservationsPage() {
  const navigate = useNavigate()
  const { reservations, fetchReservations, deleteReservation, loading } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchReservations()
  }, [])

  const filtered = reservations.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return r.check_in >= format(new Date(), 'yyyy-MM-dd') || isToday(new Date(r.check_in))
    if (filter === 'past') return r.check_out < format(new Date(), 'yyyy-MM-dd')
    return true
  })

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette réservation ?')) return
    await deleteReservation(id)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Réservations"
        subtitle={`${reservations.length} au total`}
        back
        onBack={() => navigate('/settings')}
        action={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => navigate('/reservations/new')}
          >
            Ajouter
          </Button>
        }
      />

      {/* Filtres */}
      <div className="px-4 py-2 flex gap-2 flex-shrink-0 border-b border-border">
        {(['upcoming', 'all', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === f ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary'
            )}
          >
            {f === 'upcoming' ? 'À venir' : f === 'past' ? 'Passées' : 'Toutes'}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted self-center">{filtered.length}</span>
      </div>

      <div className="scroll-area px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="Aucune réservation"
            description="Ajoutez vos réservations pour les synchroniser avec le planning"
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={() => navigate('/reservations/new')}
              >
                Ajouter une réservation
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onClick={() => navigate(`/reservations/${r.id}`)}
                onDelete={(e) => handleDelete(e, r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReservationCard({
  reservation: r,
  onClick,
  onDelete,
}: {
  reservation: Reservation
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const nights = Math.ceil(
    (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000
  )
  const isActive =
    r.check_in <= format(new Date(), 'yyyy-MM-dd') &&
    r.check_out > format(new Date(), 'yyyy-MM-dd')

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface rounded-2xl border p-4 cursor-pointer active:scale-[0.98] transition-transform shadow-card',
        isActive ? 'border-primary/40' : 'border-border'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{PLATFORM_ICONS[r.platform] ?? '📋'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-text-primary truncate">{r.guest_name}</span>
            {isActive && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">EN COURS</span>}
          </div>
          <p className="text-xs text-text-secondary truncate mb-2">
            {r.property?.name ?? 'Logement inconnu'}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Calendar size={11} />
              <span>
                {format(new Date(r.check_in + 'T12:00:00'), 'd MMM', { locale: fr })}
                {' → '}
                {format(new Date(r.check_out + 'T12:00:00'), 'd MMM', { locale: fr })}
              </span>
              <span className="text-text-muted">({nights}n)</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Users size={11} />
              <span>{r.num_guests} pers.</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Badge variant={STATUS_COLORS[r.status] as any} size="sm">
            {STATUS_LABELS[r.status]}
          </Badge>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
