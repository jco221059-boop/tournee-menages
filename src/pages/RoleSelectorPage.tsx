// PAGE: RoleSelectorPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches avec bordure colorée selon sélection.
// Icônes Tabler filaires (à remplacer par vos pictogrammes). Tags contextuels sous chaque rôle.
// Cercle de sélection avec coche. Bouton désactivé si aucun choix.

import { useState } from 'react'
import { Building2, Brush } from 'lucide-react'
import { useAuthStore, type UserRole } from '../store/authStore'
import { Spinner } from '../components/ui'
import clsx from 'clsx'

export default function RoleSelectorPage() {
  const { setRole, signOut } = useAuthStore()
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    if (!selected) return
    setSaving(true)
    await setRole(selected)
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden px-6 pb-10"
      style={{ background: '#FAF7F2' }}>

      {/* Cercles décoratifs */}
      <div className="absolute -top-28 -left-24 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: '#EDE0D0', opacity: 0.28 }} />
      <div className="absolute -bottom-20 -right-16 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: '#EDE0D0', opacity: 0.28 }} />

      {/* Logo + titre */}
      <div className="flex flex-col items-center pt-16 pb-9 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-4"
          style={{ border: '1.5px solid #EDE0D0' }}>
          {/* Remplacer par : <img src="/logo.png" alt="MénageFlow" className="w-14 h-14 object-contain" /> */}
          <svg viewBox="0 0 80 80" width="56" height="56" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
              <linearGradient id="lg2" x1="10" y1="12" x2="70" y2="68" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0D9488"/>
                <stop offset="100%" stopColor="#14B8A6"/>
              </linearGradient>
            </defs>
            <path d="M10 38 L40 12 L70 38" stroke="url(#lg2)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 34 L16 66 Q16 68 18 68 L38 68 L38 52 Q38 49 41 49 Q44 49 44 52 L44 68 L62 68 Q64 68 64 66 L64 34" stroke="url(#lg2)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M56 26 L56 18 L63 18 L63 30" stroke="#0D9488" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="31" y="19" width="6" height="6" rx="1.5" fill="#0D9488"/>
            <rect x="39" y="19" width="6" height="6" rx="1.5" fill="#0D9488"/>
            <rect x="31" y="27" width="6" height="6" rx="1.5" fill="#0D9488"/>
            <rect x="39" y="27" width="6" height="6" rx="1.5" fill="#0D9488"/>
            <circle cx="22" cy="43" r="5" fill="#0D9488"/>
            <path d="M20 43 L21.5 44.5 L24.5 41.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="29" y1="43" x2="52" y2="43" stroke="#5EEAD4" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="52" cy="43" r="5" fill="#0F766E"/>
            <path d="M50 43 L51.5 44.5 L54.5 41.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="55" r="5" fill="#14B8A6" opacity="0.7"/>
            <path d="M20 55 L21.5 56.5 L24.5 53.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="29" y1="55" x2="56" y2="55" stroke="#99F6E4" strokeWidth="3.5" strokeLinecap="round"/>
            <g transform="translate(60,28)"><path d="M0 -9 L1.8 -1.8 L9 0 L1.8 1.8 L0 9 L-1.8 1.8 L-9 0 L-1.8 -1.8 Z" fill="#FBBF24"/></g>
            <g transform="translate(72,20)" opacity="0.7"><path d="M0 -4.5 L0.9 -0.9 L4.5 0 L0.9 0.9 L0 4.5 L-0.9 0.9 L-4.5 0 L-0.9 -0.9 Z" fill="#FCD34D"/></g>
          </svg>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
          MénageFlow
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#A8937A' }}>Qui êtes-vous ?</p>
      </div>

      {/* Cartes rôles */}
      <div className="flex flex-col gap-3.5 flex-1 relative z-10">

        {/* Admin */}
        <button
          onClick={() => setSelected('admin')}
          className="w-full text-left rounded-3xl p-5 transition-all active:scale-[0.98]"
          style={{
            background: selected === 'admin' ? '#F0FDFB' : '#fff',
            border: `2px solid ${selected === 'admin' ? '#0D9488' : '#EDE0D0'}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: selected === 'admin' ? '#99F6E4' : '#CCFBF1' }}>
              {/* Remplacer par votre icône clé */}
              <Building2
                size={26}
                style={{ color: selected === 'admin' ? '#0D9488' : '#5EEAD4' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold"
                style={{ color: selected === 'admin' ? '#0F766E' : '#2C1F0E' }}>
                Conciergerie / Admin
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                Gérer les biens, workflows, missions et plannings
              </p>
              <div className="flex gap-1.5 flex-wrap mt-2.5">
                {['Logements', 'Planning', 'Workflows'].map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: selected === 'admin' ? '#CCFBF1' : '#F5F0EA',
                      color: selected === 'admin' ? '#0F766E' : '#A8937A',
                    }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* Cercle de sélection */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                border: `2px solid ${selected === 'admin' ? '#0D9488' : '#EDE0D0'}`,
                background: selected === 'admin' ? '#0D9488' : 'transparent',
              }}>
              {selected === 'admin' && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        </button>

        {/* Prestataire */}
        <button
          onClick={() => setSelected('cleaner')}
          className="w-full text-left rounded-3xl p-5 transition-all active:scale-[0.98]"
          style={{
            background: selected === 'cleaner' ? '#F0FDF4' : '#fff',
            border: `2px solid ${selected === 'cleaner' ? '#6B9E78' : '#EDE0D0'}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: selected === 'cleaner' ? '#BBF7D0' : '#DCFCE7' }}>
              {/* Remplacer par votre icône balai/prestataire */}
              <Brush
                size={26}
                style={{ color: selected === 'cleaner' ? '#6B9E78' : '#86EFAC' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold"
                style={{ color: selected === 'cleaner' ? '#2C4A30' : '#2C1F0E' }}>
                Prestataire ménage
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
                Consulter et réaliser mes missions du jour
              </p>
              <div className="flex gap-1.5 flex-wrap mt-2.5">
                {['Missions', 'Checklist', 'Rapports'].map(tag => (
                  <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: selected === 'cleaner' ? '#DCFCE7' : '#F5F0EA',
                      color: selected === 'cleaner' ? '#166534' : '#A8937A',
                    }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* Cercle de sélection */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                border: `2px solid ${selected === 'cleaner' ? '#6B9E78' : '#EDE0D0'}`,
                background: selected === 'cleaner' ? '#6B9E78' : 'transparent',
              }}>
              {selected === 'cleaner' && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        </button>

      </div>

      {/* CTA */}
      <div className="mt-7 relative z-10">
        <button
          onClick={handleConfirm}
          disabled={!selected || saving}
          className={clsx(
            'w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
            selected ? 'active:scale-[0.98]' : 'cursor-not-allowed'
          )}
          style={{
            background: selected ? '#6B9E78' : '#EDE0D0',
            color: selected ? '#fff' : '#C4A882',
          }}
        >
          {saving ? <Spinner size={22} /> : 'Continuer →'}
        </button>

        <button
          onClick={signOut}
          className="w-full text-center text-xs mt-4"
          style={{ color: '#C4A882' }}
        >
          Se déconnecter
        </button>
      </div>

    </div>
  )
}
