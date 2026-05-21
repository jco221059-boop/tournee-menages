import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Button, Input } from '../components/ui'
import { KeyRound, Home } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const signIn = useAuthStore((s) => s.signIn)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 shadow-glow">
            <Home size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Tournée Ménages</h1>
          <p className="text-text-secondary text-sm mt-1">Organisation des ménages Airbnb</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            autoComplete="email"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={<KeyRound size={18} />}
            className="w-full mt-2"
          >
            Se connecter
          </Button>
        </form>

        <p className="text-center text-xs text-text-muted mt-8">
          Tournée Ménages v1.0 — Usage privé
        </p>
      </div>
    </div>
  )
}
