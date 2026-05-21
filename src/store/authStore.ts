import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  initialize: async () => {
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session)
      const session = await Promise.race([sessionPromise, timeout])
      set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
      })
    } catch {
      set({ user: null, session: null, loading: false })
    }

    supabase.auth.onAuthStateChange((_, session) => {
      set({ user: session?.user ?? null, session })
    })
  },
}))
