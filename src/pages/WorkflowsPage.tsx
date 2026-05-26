// PAGE: WorkflowsPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches groupées par ville.
// Accent teal pour workflows standards, ambre pour personnalisés.
// Tags type / actif / nombre d'étapes. Corbeille + chevron à droite.
// État vide avec CTA.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, GitBranch, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { EmptyState, Spinner } from '../components/ui'
import type { Workflow } from '../types'

function groupByProperty(workflows: Workflow[]): Record<string, Workflow[]> {
  return workflows.reduce((acc, w) => {
    const city = w.property?.address?.split(',').slice(-1)[0]?.trim()
      ?? w.property?.name
      ?? 'Autre'
    if (!acc[city]) acc[city] = []
    acc[city].push(w)
    return acc
  }, {} as Record<string, Workflow[]>)
}

export default function WorkflowsPage() {
  const navigate = useNavigate()
  const { workflows, fetchWorkflows, deleteWorkflow, loading } = useAppStore()

  useEffect(() => { fetchWorkflows() }, [])

  const grouped = groupByProperty(workflows)

  const handleDelete = async (e: React.MouseEvent, workflowId: string) => {
    e.stopPropagation()
    await deleteWorkflow(workflowId)
  }

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
        <h1 className="text-lg font-bold flex-1"
          style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
          Workflows
        </h1>
        <button
          onClick={() => navigate('/config/workflows/new')}
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-full"
          style={{ background: '#6B9E78' }}
        >
          <Plus size={13} />
          Nouveau
        </button>
      </div>

      {/* List */}
      <div className="scroll-area px-5 pt-5 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={<GitBranch size={44} />}
            title="Aucun workflow"
            subtitle="Créez votre premier workflow pour guider les ménages."
            action={
              <button
                onClick={() => navigate('/config/workflows/new')}
                className="text-white text-sm font-bold px-4 py-2 rounded-full"
                style={{ background: '#6B9E78' }}
              >
                Créer un workflow
              </button>
            }
          />
        ) : (
          Object.entries(grouped).map(([city, wfs]) => (
            <div key={city} className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
                style={{ color: '#C4A882' }}>
                {city}
              </p>
              <div className="flex flex-col gap-2.5">
                {wfs.map(workflow => {
                  const isStandard = workflow.is_active
                  const accentColor = isStandard ? '#0D9488' : '#D97706'
                  const iconBg = isStandard ? '#CCFBF1' : '#FEF3C7'
                  const iconColor = isStandard ? '#0D9488' : '#D97706'
                  const stepCount = workflow.steps?.length ?? 0

                  return (
                    <div
                      key={workflow.id}
                      onClick={() => navigate(`/config/workflows/${workflow.id}`)}
                      className="relative overflow-hidden flex items-center gap-3.5 rounded-2xl px-4 py-3.5 cursor-pointer active:scale-[0.98] transition-transform"
                      style={{
                        background: '#fff',
                        border: '1px solid #EDE0D0',
                        opacity: !workflow.is_active ? 0.55 : 1,
                      }}
                    >
                      {/* Accent gauche */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                        style={{ background: accentColor }} />

                      {/* Icône */}
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: iconBg, color: iconColor }}>
                        <GitBranch size={20} />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate mb-1" style={{ color: '#2C1F0E' }}>
                          {workflow.name}
                        </p>
                        {workflow.property && (
                          <p className="text-xs truncate mb-2 flex items-center gap-1"
                            style={{ color: '#A8937A' }}>
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M1 7L5.5 2 10 7" stroke="currentColor" strokeWidth="1.3"
                                strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2 6.5V9.5a.5.5 0 0 0 .5.5H4V8h3v2h1.5a.5.5 0 0 0 .5-.5V6.5"
                                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {workflow.property.name}
                          </p>
                        )}
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: isStandard ? '#CCFBF1' : '#FEF3C7',
                              color: isStandard ? '#0F766E' : '#78350F',
                            }}>
                            {isStandard ? '⚡ Standard' : '✏️ Perso'}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: workflow.is_active ? '#DCFCE7' : '#F5F0EA',
                              color: workflow.is_active ? '#166534' : '#A8937A',
                            }}>
                            {workflow.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          {stepCount > 0 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: '#F5F0EA', color: '#7C6040' }}>
                              {stepCount} étape{stepCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                          style={{ color: '#D5C4AF' }}>
                          <path d="M5.5 3.5L10.5 8l-5 4.5" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <button
                          onClick={e => handleDelete(e, workflow.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: '#FEF2F2', color: '#DC2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
