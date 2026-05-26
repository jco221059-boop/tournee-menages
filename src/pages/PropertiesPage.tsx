// PAGE: PropertiesPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches groupées par ville.
// Accent coloré bord gauche : teal pour appartements, vert sauge pour maisons.
// Tags type / pièces / workflows. Barre de recherche avec loupe à droite.
// État vide avec CTA.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Home, Building } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { EmptyState, Spinner } from '../components/ui'
import type { Property } from '../types'

function groupByCity(properties: Property[]): Record<string, Property[]> {
  return properties.reduce((acc, p) => {
    const city = p.address?.split(',').slice(-1)[0]?.trim() ?? 'Autre'
    if (!acc[city]) acc[city] = []
    acc[city].push(p)
    return acc
  }, {} as Record<string, Property[]>)
}

export default function PropertiesPage() {
  const navigate = useNavigate()
  const { properties, fetchProperties, loading } = useAppStore()
  const [search, setSearch] = useState('')

  useEffect(() => { fetchProperties() }, [])

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = groupByCity(filtered)
  const isApartment = (p: Property) => p.property_type === 'apartment'

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
        <h1 className="text-lg font-bold flex-1" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
          Logements
        </h1>
        <button
          onClick={() => navigate('/config/properties/new')}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-full"
          style={{ background: '#6B9E78' }}
        >
          <Plus size={13} />
          Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="px-5 py-3.5 flex-shrink-0">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un logement…"
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
            style={{
              background: '#fff',
              border: '1px solid #EDE0D0',
              color: '#2C1F0E',
              fontFamily: 'inherit',
              paddingRight: 40,
            }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: '#C4A882', pointerEvents: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="scroll-area px-5 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Home size={44} />}
            title="Aucun logement"
            subtitle="Ajoutez votre premier logement pour commencer."
            action={
              <button
                onClick={() => navigate('/config/properties/new')}
                className="text-white text-sm font-bold px-4 py-2 rounded-full"
                style={{ background: '#6B9E78' }}
              >
                Ajouter un logement
              </button>
            }
          />
        ) : (
          Object.entries(grouped).map(([city, props]) => (
            <div key={city} className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
                style={{ color: '#C4A882' }}>
                {city}
              </p>
              <div className="flex flex-col gap-2.5">
                {props.map(property => {
                  const isApt = isApartment(property)
                  const accentColor = isApt ? '#0D9488' : '#6B9E78'
                  const iconBg = isApt ? '#CCFBF1' : '#DCFCE7'
                  const iconColor = isApt ? '#0D9488' : '#6B9E78'
                  const roomCount = property.rooms?.length ?? 0
                  const workflowCount = property.workflows?.length ?? 0

                  return (
                    <div
                      key={property.id}
                      onClick={() => navigate(`/config/properties/${property.id}`)}
                      className="relative overflow-hidden flex items-center gap-3.5 rounded-2xl px-4 py-3.5 cursor-pointer active:scale-[0.98] transition-transform"
                      style={{ background: '#fff', border: '1px solid #EDE0D0' }}
                    >
                      {/* Accent gauche */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ background: accentColor }} />

                      {/* Icône */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color: iconColor }}>
                        {isApt ? <Building size={20} /> : <Home size={20} />}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate mb-1" style={{ color: '#2C1F0E' }}>
                          {property.name}
                        </p>
                        {property.address && (
                          <p className="text-xs truncate mb-2" style={{ color: '#A8937A' }}>
                            {property.address}
                          </p>
                        )}
                        <div className="flex gap-1.5 flex-wrap">
                          {property.apartment_type && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: '#F5F0EA', color: '#A8937A' }}>
                              {property.apartment_type.toUpperCase()}
                            </span>
                          )}
                          {roomCount > 0 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: '#EEF4EF', color: '#2C4A30' }}>
                              {roomCount} pièce{roomCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {workflowCount > 0 ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: '#CCFBF1', color: '#0F766E' }}>
                              {workflowCount} workflow{workflowCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: '#FEF3C7', color: '#78350F' }}>
                              Sans workflow
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0"
                        style={{ color: '#D5C4AF' }}>
                        <path d="M5.5 3.5L10.5 8l-5 4.5" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
