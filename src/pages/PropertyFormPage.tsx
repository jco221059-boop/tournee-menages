import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PageHeader, Button, Input, Textarea, Select } from '../components/ui'
import type { Property } from '../types'

type FormData = Omit<Property, 'id' | 'created_at' | 'updated_at'>

const defaults: FormData = {
  name: '',
  address: '',
  lat: null,
  lng: null,
  surface_m2: 50,
  bedrooms: 1,
  bathrooms: 1,
  base_cleaning_duration_min: 90,
  notes: '',
}

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { properties, addProperty, updateProperty, deleteProperty, fetchProperties } = useAppStore()
  const isEdit = id !== 'new' && !!id

  const [form, setForm] = useState<FormData>(defaults)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (isEdit) {
      const prop = properties.find((p) => p.id === id)
      if (prop) {
        setForm({
          name: prop.name,
          address: prop.address,
          lat: prop.lat,
          lng: prop.lng,
          surface_m2: prop.surface_m2,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          base_cleaning_duration_min: prop.base_cleaning_duration_min,
          notes: prop.notes ?? '',
        })
      } else {
        fetchProperties()
      }
    }
  }, [id, properties])

  const set = (field: keyof FormData, value: string | number | null) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Nom requis'
    if (!form.address.trim()) errs.address = 'Adresse requise'
    if (form.surface_m2 <= 0) errs.surface_m2 = 'Surface invalide'
    if (form.base_cleaning_duration_min < 15) errs.base_cleaning_duration_min = 'Durée minimum : 15 min'
    if (Object.keys(errs).length > 0) { setErrors(errs); return false }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit && id) {
        await updateProperty(id, form)
      } else {
        await addProperty(form)
      }
      navigate('/properties')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Supprimer ce logement ?')) return
    setLoading(true)
    await deleteProperty(id)
    navigate('/properties')
  }

  const durationOptions = [
    { value: '45', label: '45 min' },
    { value: '60', label: '1h' },
    { value: '90', label: '1h30' },
    { value: '120', label: '2h' },
    { value: '150', label: '2h30' },
    { value: '180', label: '3h' },
    { value: '240', label: '4h' },
    { value: '300', label: '5h' },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isEdit ? 'Modifier le logement' : 'Nouveau logement'}
        back
        onBack={() => navigate('/properties')}
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
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Informations</h2>
            <Input
              label="Nom du logement *"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Studio Centre-ville"
              error={errors.name}
            />
            <Input
              label="Adresse complète *"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="12 rue de la Paix, 75001 Paris"
              error={errors.address}
            />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Caractéristiques</h2>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Surface (m²)"
                type="number"
                value={form.surface_m2}
                onChange={(e) => set('surface_m2', Number(e.target.value))}
                min="10"
                max="500"
                error={errors.surface_m2}
              />
              <Input
                label="Chambres"
                type="number"
                value={form.bedrooms}
                onChange={(e) => set('bedrooms', Number(e.target.value))}
                min="0"
                max="20"
              />
              <Input
                label="Salles de bain"
                type="number"
                value={form.bathrooms}
                onChange={(e) => set('bathrooms', Number(e.target.value))}
                min="1"
                max="10"
              />
            </div>
            <Select
              label="Durée de ménage de base"
              value={String(form.base_cleaning_duration_min)}
              onChange={(e) => set('base_cleaning_duration_min', Number(e.target.value))}
              options={durationOptions}
              error={errors.base_cleaning_duration_min}
            />
            <p className="text-xs text-text-muted -mt-2">
              Cette durée sera ajustée selon le niveau de saleté (×0,75 propre / ×1,35 sale)
            </p>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Coordonnées GPS (optionnel)</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                type="number"
                value={form.lat ?? ''}
                onChange={(e) => set('lat', e.target.value ? Number(e.target.value) : null)}
                placeholder="48.8566"
                step="0.0001"
              />
              <Input
                label="Longitude"
                type="number"
                value={form.lng ?? ''}
                onChange={(e) => set('lng', e.target.value ? Number(e.target.value) : null)}
                placeholder="2.3522"
                step="0.0001"
              />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-4">
            <Textarea
              label="Notes"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Informations utiles : code alarme, parking, accès…"
              rows={3}
            />
          </div>

          <Button
            size="lg"
            loading={loading}
            icon={<Save size={18} />}
            onClick={handleSave}
            className="w-full"
          >
            {isEdit ? 'Enregistrer les modifications' : 'Créer le logement'}
          </Button>
        </div>
      </div>
    </div>
  )
}
