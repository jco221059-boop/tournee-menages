// PAGE: LoginPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, cartes blanches, accents vert sauge #6B9E78.
// Logo SVG inline (à remplacer par <img src="/logo.png" /> en prod).
// Switcher Mot de passe / Lien magique en pills. Cercles décoratifs en filigrane.

import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Button, Input } from '../components/ui'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Entrez votre email'); return }
    setError('')
    setMagicLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setMagicLoading(false)
    if (err) setError(err.message)
    else setMagicSent(true)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-7 relative overflow-hidden"
      style={{ background: '#FAF7F2' }}>

      {/* Cercles décoratifs */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: '#EDE0D0', opacity: 0.3 }} />
      <div className="absolute -bottom-24 -right-20 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: '#EDE0D0', opacity: 0.3 }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo + titre */}
        <div className="flex flex-col items-center mb-9">
          <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-content: center p-2.5 mb-4"
            style={{ border: '1.5px solid #EDE0D0' }}>
            {/* Remplacer par : <img src="/logo.png" alt="MénageFlow" className="w-full h-full object-contain" /> */}
            <svg viewBox="0 0 80 80" width="76" height="76" xmlns="http://www.w3.org/2000/svg" fill="none">
              <defs>
                <linearGradient id="lg" x1="10" y1="12" x2="70" y2="68" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0D9488"/>
                  <stop offset="100%" stopColor="#14B8A6"/>
                </linearGradient>
              </defs>
              <path d="M10 38 L40 12 L70 38" stroke="url(#lg)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 34 L16 66 Q16 68 18 68 L38 68 L38 52 Q38 49 41 49 Q44 49 44 52 L44 68 L62 68 Q64 68 64 66 L64 34" stroke="url(#lg)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          <h1 className="text-3xl font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.025em' }}>
            MénageFlow
          </h1>
          <p className="text-sm mt-1" style={{ color: '#C4A882' }}>
            Votre assistant ménage pas-à-pas
          </p>
        </div>

        {/* Switcher mode */}
        <div className="flex p-1 rounded-xl mb-6" style={{ background: '#EDE0D0' }}>
          <button
            onClick={() => setMode('password')}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all"
            style={mode === 'password'
              ? { background: '#fff', color: '#2C1F0E', border: '1px solid #EDE0D0' }
              : { background: 'transparent', color: '#A8937A' }}
          >
            Mot de passe
          </button>
          <button
            onClick={() => setMode('magic')}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all"
            style={mode === 'magic'
              ? { background: '#fff', color: '#2C1F0E', border: '1px solid #EDE0D0' }
              : { background: 'transparent', color: '#A8937A' }}
          >
            Lien magique
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePassword} className="flex flex-col gap-3.5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {error && (
              <p className="text-sm rounded-xl px-3 py-2"
                style={{ color: '#7F1D1D', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-base font-bold text-white mt-1 transition-opacity"
              style={{ background: '#6B9E78' }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className="text-center text-xs"
              style={{ color: '#C4A882' }}
            >
              Pas de mot de passe ?{' '}
              <span style={{ color: '#6B9E78', fontWeight: 600 }}>Utiliser un lien magique</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3.5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@example.com"
              autoComplete="email"
              required
            />
            {error && (
              <p className="text-sm rounded-xl px-3 py-2"
                style={{ color: '#7F1D1D', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                {error}
              </p>
            )}
            {magicSent ? (
              <div className="rounded-2xl px-4 py-5 text-center"
                style={{ background: '#EEF4EF', border: '1px solid #B5D4BA' }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: '#6B9E78' }}>
                  <Mail size={22} color="#fff" />
                </div>
                <p className="text-sm font-bold" style={{ color: '#2C4A30' }}>Lien envoyé !</p>
                <p className="text-xs mt-1" style={{ color: '#6B9E78' }}>
                  Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={magicLoading}
                className="w-full py-4 rounded-2xl text-base font-bold text-white mt-1 flex items-center justify-center gap-2"
                style={{ background: '#6B9E78' }}
              >
                <Mail size={18} />
                {magicLoading ? 'Envoi…' : 'Envoyer le lien par email'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
