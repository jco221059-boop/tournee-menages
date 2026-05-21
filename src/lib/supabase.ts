import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY requises dans .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export type Database = {
  public: {
    Tables: {
      workers: {
        Row: {
          id: string
          name: string
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workers']['Insert']>
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string
          lat: number | null
          lng: number | null
          surface_m2: number
          bedrooms: number
          bathrooms: number
          base_cleaning_duration_min: number
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      reservations: {
        Row: {
          id: string
          property_id: string
          guest_name: string
          check_in: string
          check_out: string
          num_guests: number
          platform: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      cleaning_jobs: {
        Row: {
          id: string
          reservation_id: string | null
          property_id: string
          scheduled_date: string
          priority: string
          dirtiness: string
          adjusted_duration_min: number
          cleaning_window_start: string | null
          cleaning_window_end: string | null
          assigned_worker_id: string | null
          status: string
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
      }
      daily_plans: {
        Row: {
          id: string
          date: string
          status: string
          total_jobs: number
          completed_jobs: number
          car_trips: number
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      plan_steps: {
        Row: {
          id: string
          daily_plan_id: string
          cleaning_job_id: string | null
          worker_id: string
          step_type: string
          start_time: string
          end_time: string
          duration_min: number
          order_index: number
          notes: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          type: string
          severity: string
          message: string
          property_id: string | null
          reservation_id: string | null
          date: string | null
          resolved: boolean
          created_at: string
        }
      }
      app_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
      }
    }
  }
}
