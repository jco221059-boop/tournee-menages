// PAGE: MissionFormPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, sections avec labels uppercase.
// Sélecteur de workflow en cartes radio visuelles (remplace select).
// Suivi du temps en chips visuelles.
// Horaires en deux colonnes. CTA fixe en bas.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Zap, Pencil, Minus } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Input, Select, Textarea, Spinner } from '../components/ui'
import type { Workflow } from '../types'
import clsx from 'clsx'

export default function MissionFormPage() {
  const navigate = useNavigate()
  const { properties, workflows, fetchProperties, fetchWorkflows, createMission, createDefaultWorkflow, loading } = useAppStore()

  const [propertyId, setPropertyId] = useState('')
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [useWorkflow, setUseWorkflow] = useState<'none' | string>('none')
  const [date, setDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [checkinTime, setCheckinTime] = useState('')
  const [timeTracking, setTimeTracking] = useState<'none' | 'start_end'>('none')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [creatingWorkflow, setCreatingWorkflow] = useState(false)

  useEffect(() => { fetchProperties() }, [])
  useEffect(() => {
    if (propertyId) fetchWorkflows(propertyId)
  }, [propertyId])

  const propertyWorkflows = workflows.filter(w => w.property_id === propertyId)
  const canSubmit = !!propertyId && !!date

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    await createMission({
      property_id: propertyId,
      workflow_id: useWorkflow === 'none' ? null : useWorkflow,
      scheduled_date: date,
      scheduled_time: scheduledTime || null,
      checkin_time: checkinTime || null,
      time_tracking_mode: timeTracking,
      notes: notes || null,
      status: 'pending',
    })
    setSaving(false)
    navigate('/missions')
  }

  const handleCreateDefaultWorkflow = async () => {
    setCreatingWorkflow(true)
    const wf = await createDefaultWorkflow(propertyId)
    if (wf) setUseWorkflow(wf.id)
    setCreatingWorkflow(false)
  }

  const propertyOptions = properties.map(p => ({ value: p.id, label: p.name }))

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
          Nouvelle mission
        </h1>
      </div>

      <div className="scroll-area px-5 pt-5 pb-5">

        {/* Logement */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
            style={{ color: '#C4A882' }}>
            Logement
          </p>
          <Select
            label=""
            value={propertyId}
            onChange={e => { setPropertyId(e.target.value); setUseWorkflow('none') }}
            options={[{ value: '', label: 'Choisir un logement…' }, ...propertyOptions]}
          />
        </div>

        {/* Workflow — visible si logement sélectionné */}
        {propertyId && (
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
              style={{ color: '#C4A882' }}>
              Workflow
            </p>

            <div className="flex flex-col gap-2">
              {/* Option : sans workflow */}
              <button
                onClick={() => setUseWorkflow('none')}
                className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98]"
                style={{
                  background: useWorkflow === 'none' ? '#F5F0EA' : '#fff',
                  border: `1.5px solid ${useWorkflow === 'none' ? '#A8937A' : '#EDE0D0'}`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F5F0EA', color: '#A8937A' }}>
                  <Minus size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold"
                    style={{ color: useWorkflow === 'none' ? '#7C6040' : '#2C1F0E' }}>
                    Sans workflow
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                    Mission libre, sans étapes guidées
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: `2px solid ${useWorkflow === 'none' ? '#A8937A' : '#EDE0D0'}`,
                    background: useWorkflow === 'none' ? '#A8937A' : 'transparent',
                  }}>
                  {useWorkflow === 'none' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>

              {/* Pas de workflows : bouton génération auto */}
              {propertyWorkflows.length === 0 && (
                <button
                  onClick={handleCreateDefaultWorkflow}
                  disabled={creatingWorkflow}
                  className="flex items-center gap-3 rounded-2xl p-3.5 transition-all"
                  style={{ background: '#CCFBF1', border: '1.5px solid #99F6E4' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#0D9488', color: '#fff' }}>
                    {creatingWorkflow ? <Spinner size={16} /> : <Zap size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: '#0F766E' }}>
                      Créer le workflow standard automatiquement
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#14B8A6' }}>
                      Génère les étapes standards pour ce logement
                    </p>
                  </div>
                </button>
              )}

              {/* Workflows existants */}
              {propertyWorkflows.map(wf => (
                <button
                  key={wf.id}
                  onClick={() => setUseWorkflow(wf.id)}
                  className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: useWorkflow === wf.id ? '#EEF4EF' : '#fff',
                    border: `1.5px solid ${useWorkflow === wf.id ? '#6B9E78' : '#EDE0D0'}`,
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: wf.is_active ? '#CCFBF1' : '#FEF3C7',
                      color: wf.is_active ? '#0D9488' : '#D97706',
                    }}>
                    {wf.is_active ? <Zap size={16} /> : <Pencil size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: useWorkflow === wf.id ? '#2C4A30' : '#2C1F0E' }}>
                      {wf.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: wf.is_active ? '#CCFBF1' : '#FEF3C7',
                          color: wf.is_active ? '#0F766E' : '#78350F',
                        }}>
                        {wf.is_active ? '⚡ Standard' : '✏️ Perso'}
                      </span>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: `2px solid ${useWorkflow === wf.id ? '#6B9E78' : '#EDE0D0'}`,
                      background: useWorkflow === wf.id ? '#6B9E78' : 'transparent',
                    }}>
                    {useWorkflow === wf.id && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Horaires */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
            style={{ color: '#C4A882' }}>
            Horaires
          </p>
          <Input
            label="Date *"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <div className="flex gap-2.5 mt-3">
            <div className="flex-1">
              <Input
                label="Heure début"
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Check-in client"
                type="time"
                value={checkinTime}
                onChange={e => setCheckinTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Suivi du temps */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
            style={{ color: '#C4A882' }}>
            Suivi du temps
          </p>
          <div className="flex gap-2">
            {[
              { value: 'none' as const,      label: 'Aucun suivi',  icon: '⏸' },
              { value: 'start_end' as const,  label: 'Début — fin', icon: '⏱' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTimeTracking(opt.value)}
                className="flex-1 rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 transition-all"
                style={{
                  background: timeTracking === opt.value ? '#EEF4EF' : '#fff',
                  border: `1.5px solid ${timeTracking === opt.value ? '#6B9E78' : '#EDE0D0'}`,
                }}
              >
                <span className="text-lg">{opt.icon}</span>
                <span className="text-xs font-semibold"
                  style={{ color: timeTracking === opt.value ? '#2C4A30' : '#A8937A' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
            style={{ color: '#C4A882' }}>
            Notes
          </p>
          <Textarea
            label=""
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white transition-all"
          style={{
            background: canSubmit ? '#6B9E78' : '#EDE0D0',
            color: canSubmit ? '#fff' : '#C4A882',
          }}
        >
          {saving ? <Spinner size={20} /> : <Plus size={18} />}
          {saving ? 'Création…' : 'Créer la mission'}
        </button>
      </div>

    </div>
  )
}
