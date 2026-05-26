import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../types'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  role: UserRole | null

  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  setRole: (role: UserRole) => Promise<void>
}

export type { UserRole }

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  role: (localStorage.getItem('userRole') as UserRole | null),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    return null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('userRole')
    set({ user: null, session: null, role: null })
  },

  setRole: async (role: UserRole) => {
    localStorage.setItem('userRole', role)
    set({ role })
  },

  initialize: async () => {
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session)
      const session = await Promise.race([sessionPromise, timeout])
      const storedRole = localStorage.getItem('userRole') as UserRole | null
      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        role: storedRole,
      })
    } catch {
      set({ user: null, session: null, loading: false, role: null })
    }

    supabase.auth.onAuthStateChange((_, session) => {
      const storedRole = localStorage.getItem('userRole') as UserRole | null
      set({ user: session?.user ?? null, session, role: storedRole })
    })
  },
}))
