import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Save, Trash2, Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PageHeader, Button, Input, Select, Textarea } from '../components/ui'
import { calculatePriority, adjustDuration, calculateCleaningWindow } from '../lib/optimizer'
import type { Reservation, Platform, ReservationStatus } from '../types'

type FormData = Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'property'>

const defaults: FormData = {
  property_id: '',
  guest_name: '',
  check_in: format(new Date(), 'yyyy-MM-dd'),
  check_out: format(new Date(), 'yyyy-MM-dd'),
  num_guests: 2,
  platform: 'airbnb',
  status: 'confirmed',
  notes: '',
}

export default function ReservationFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    properties,
    reservations,
    fetchProperties,
    fetchReservations,
    addReservation,
    updateReservation,
    deleteReservation,
    addCleaningJob,
    settings,
  } = useAppStore()
  const isEdit = id !== 'new' && !!id
  const [form, setForm] = useState<FormData>(defaults)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [createJob, setCreateJob] = useState(true)

  useEffect(() => {
    if (properties.length === 0) fetchProperties()
    if (isEdit) {
      const r = reservations.find((r) => r.id === id)
      if (r) {
        setForm({
          property_id: r.property_id,
          guest_name: r.guest_name,
          check_in: r.check_in,
          check_out: r.check_out,
          num_guests: r.num_guests,
          platform: r.platform,
          status: r.status,
          notes: r.notes ?? '',
        })
      } else {
        fetchReservations()
      }
    } else if (properties.length > 0) {
      setForm((f) => ({ ...f, property_id: properties[0].id }))
    }
  }, [id, reservations, properties])

  const setField = (field: keyof FormData, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.property_id) errs.property_id = 'Logement requis'
    if (!form.guest_name.trim()) errs.guest_name = 'Nom requis'
    if (!form.check_in) errs.check_in = 'Date requise'
    if (!form.check_out) errs.check_out = 'Date requise'
    if (form.check_out <= form.check_in) errs.check_out = 'Doit être après le check-in'
    if (Object.keys(errs).length > 0) { setErrors(errs); return false }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      let reservationId: string
      if (isEdit && id) {
        await updateReservation(id, form)
        reservationId = id
      } else {
        const res = await addReservation(form)
        reservationId = res.id

        if (createJob && form.property_id) {
          const property = properties.find((p) => p.id === form.property_id)
          if (property) {
            const priority = calculatePriority(form.check_in, new Date())
            const window = calculateCleaningWindow(form.check_out, form.check_in, settings)
            const duration = adjustDuration(property.base_cleaning_duration_min, 'normal')
            await addCleaningJob({
              reservation_id: reservationId,
              property_id: form.property_id,
              scheduled_date: form.check_out,
              priority,
              dirtiness: 'normal',
              adjusted_duration_min: duration,
              cleaning_window_start: window.start,
              cleaning_window_end: window.end,
              assigned_worker_id: null,
              status: 'pending',
              notes: null,
            })
          }
        }
      }
      navigate('/reservations')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Supprimer cette réservation ?')) return
    await deleteReservation(id)
    navigate('/reservations')
  }

  const platformOptions = [
    { value: 'airbnb', label: '🏠 Airbnb' },
    { value: 'booking', label: '🔵 Booking.com' },
    { value: 'direct', label: '✉️ Direct' },
    { value: 'other', label: '📋 Autre' },
  ]

  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'cleaning_needed', label: 'Ménage requis' },
    { value: 'cleaned', label: 'Ménage fait' },
    { value: 'cancelled', label: 'Annulée' },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isEdit ? 'Modifier la réservation' : 'Nouvelle réservation'}
        back
        onBack={() => navigate('/reservations')}
        action={
          isEdit && (
            <button
              onClick={handleDelete}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-danger/10 text-danger"
            >
              <Trash2 size={16} />
            </button>
          )
        }
      />

      <div className="scroll-area px-4 py-4">
        <div className="flex flex-col gap-4 max-w-lg">
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Réservation</h2>
            <Select
              label="Logement *"
              value={form.property_id}
              onChange={(e) => setField('property_id', e.target.value)}
              options={[
                { value: '', label: '— Sélectionner —' },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
              error={errors.property_id}
            />
            <Input
              label="Nom du voyageur *"
              value={form.guest_name}
              onChange={(e) => setField('guest_name', e.target.value)}
              placeholder="Ex: Marie Dupont"
              error={errors.guest_name}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check-in *"
                type="date"
                value={form.check_in}
                onChange={(e) => setField('check_in', e.target.value)}
                error={errors.check_in}
              />
              <Input
                label="Check-out *"
                type="date"
                value={form.check_out}
                onChange={(e) => setField('check_out', e.target.value)}
                error={errors.check_out}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre de voyageurs"
                type="number"
                value={form.num_guests}
                onChange={(e) => setField('num_guests', Number(e.target.value))}
                min="1"
                max="20"
              />
              <Select
                label="Plateforme"
                value={form.platform}
                onChange={(e) => setField('platform', e.target.value as Platform)}
                options={platformOptions}
              />
            </div>
            <Select
              label="Statut"
              value={form.status}
              onChange={(e) => setField('status', e.target.value as ReservationStatus)}
              options={statusOptions}
            />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-4">
            <Textarea
              label="Notes"
              value={form.notes ?? ''}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Instructions spéciales, remarques…"
            />
          </div>

          {!isEdit && (
            <div className="bg-surface rounded-2xl border border-primary/30 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary text-sm">Créer le ménage automatiquement</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Un job de ménage sera créé pour le jour du check-out avec les paramètres par défaut
                </p>
                <button
                  onClick={() => setCreateJob(!createJob)}
                  className={`mt-2 w-10 h-5 rounded-full transition-colors relative ${createJob ? 'bg-primary' : 'bg-surface-3'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${createJob ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          )}

          <Button
            size="lg"
            loading={loading}
            icon={<Save size={18} />}
            onClick={handleSave}
            className="w-full"
          >
            {isEdit ? 'Enregistrer' : 'Créer la réservation'}
          </Button>
        </div>
      </div>
    </div>
  )
}
