// PAGE: ConfigPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches, accents colorés par section.
// Barre de stats rapides (logements / tâches / workflows) ajoutée en haut.
// 3 cartes avec accent coloré en coin, icône, compteur dynamique.
// Teal pour logements, vert sauge pour tâches, ambre pour workflows.

import { useNavigate } from 'react-router-dom'
import { Building, ClipboardList, GitBranch } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function ConfigPage() {
  const navigate = useNavigate()
  const { properties, tasks, workflows } = useAppStore()

  const sections = [
    {
      key: 'properties',
      title: 'Logements',
      desc: 'Gérer les propriétés, pièces et codes d\'accès',
      icon: Building,
      count: properties?.length ?? 0,
      countLabel: 'propriété',
      route: '/config/properties',
      accentBg: '#CCFBF1',
      accentColor: '#0D9488',
      accentCorner: '#0D9488',
      tagBg: '#CCFBF1',
      tagColor: '#0F766E',
    },
    {
      key: 'tasks',
      title: 'Bibliothèque de tâches',
      desc: 'Créer et modifier les tâches réutilisables',
      icon: ClipboardList,
      count: tasks?.length ?? 0,
      countLabel: 'tâche',
      route: '/config/tasks',
      accentBg: '#DCFCE7',
      accentColor: '#6B9E78',
      accentCorner: '#6B9E78',
      tagBg: '#DCFCE7',
      tagColor: '#166534',
    },
    {
      key: 'workflows',
      title: 'Workflows',
      desc: 'Créer les séquences de ménage par logement',
      icon: GitBranch,
      count: workflows?.length ?? 0,
      countLabel: 'workflow',
      route: '/config/workflows',
      accentBg: '#FEF3C7',
      accentColor: '#D97706',
      accentCorner: '#D97706',
      tagBg: '#FEF3C7',
      tagColor: '#78350F',
    },
  ]

  const stats = [
    { val: properties?.length ?? 0, lbl: 'Logements' },
    { val: tasks?.length ?? 0,      lbl: 'Tâches' },
    { val: workflows?.length ?? 0,  lbl: 'Workflows' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-0 flex-shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: '#C4A882' }}>
          Configuration
        </p>
        <h1 className="text-3xl font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.025em' }}>
          Mon espace
        </h1>
        <p className="text-sm mt-1" style={{ color: '#A8937A' }}>
          Logements · Tâches · Workflows
        </p>
      </div>

      <div className="scroll-area px-5 pt-6 pb-6">

        {/* Stats rapides */}
        <div className="flex gap-2 mb-6">
          {stats.map(s => (
            <div key={s.lbl} className="flex-1 rounded-2xl py-3 text-center"
              style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
              <div className="text-xl font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.03em' }}>
                {s.val}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: '#C4A882' }}>
                {s.lbl}
              </div>
            </div>
          ))}
        </div>

        {/* Cards */}
        {sections.map(s => (
          <div
            key={s.key}
            onClick={() => navigate(s.route)}
            className="relative overflow-hidden rounded-3xl p-5 mb-3.5 cursor-pointer active:scale-[0.98] transition-transform flex items-center gap-4"
            style={{ background: '#fff', border: '1px solid #EDE0D0' }}
          >
            {/* Accent coin */}
            <div
              className="absolute top-0 right-0 w-20 h-20 rounded-bl-full pointer-events-none"
              style={{ background: s.accentCorner, opacity: 0.07 }}
            />

            {/* Icône */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.accentBg, color: s.accentColor }}
            >
              <s.icon size={24} />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold mb-1" style={{ color: '#2C1F0E', letterSpacing: '-0.01em' }}>
                {s.title}
              </h2>
              <p className="text-xs mb-2.5" style={{ color: '#A8937A', lineHeight: 1.4 }}>
                {s.desc}
              </p>
              <span
                className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: s.tagBg, color: s.tagColor }}
              >
                {s.count} {s.countLabel}{s.count > 1 ? 's' : ''}
              </span>
            </div>

            {/* Chevron */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0"
              style={{ color: '#D5C4AF' }}>
              <path d="M6.5 4.5L11.5 9l-5 4.5" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))}

      </div>
    </div>
  )
}
