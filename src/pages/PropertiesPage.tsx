import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Home, Bed, Bath, Clock, ChevronRight, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { PageHeader, Card, Button, EmptyState, Spinner } from '../components/ui'
import { formatDuration } from '../lib/optimizer'
import type { Property } from '../types'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const { properties, fetchProperties, deleteProperty, loading } = useAppStore()

  useEffect(() => {
    fetchProperties()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Supprimer ce logement et toutes ses réservations ?')) return
    await deleteProperty(id)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Logements"
        subtitle={`${properties.length} logement(s)`}
        back
        onBack={() => navigate('/settings')}
        action={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => navigate('/properties/new')}
          >
            Ajouter
          </Button>
        }
      />

      <div className="scroll-area px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={<Home size={28} />}
            title="Aucun logement"
            description="Ajoutez vos logements Airbnb pour commencer"
            action={
              <Button
                icon={<Plus size={16} />}
                onClick={() => navigate('/properties/new')}
              >
                Ajouter un logement
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onClick={() => navigate(`/properties/${p.id}`)}
                onDelete={(e) => handleDelete(e, p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PropertyCard({
  property,
  onClick,
  onDelete,
}: {
  property: Property
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <Card pressable onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Home size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{property.name}</h3>
          <p className="text-xs text-text-secondary truncate mt-0.5">{property.address}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Home size={12} />
              <span>{property.surface_m2} m²</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Bed size={12} />
              <span>{property.bedrooms} ch.</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Bath size={12} />
              <span>{property.bathrooms} sdb.</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Clock size={12} />
              <span>{formatDuration(property.base_cleaning_duration_min)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <ChevronRight size={16} className="text-text-muted" />
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  )
}
