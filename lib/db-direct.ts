import { neon } from "@neondatabase/serverless"

/**
 * Direct Postgres connection to Supabase database.
 * This bypasses the PostgREST API and connects directly to Postgres,
 * avoiding schema cache issues.
 */
export const sql = neon(process.env.SUPABASE_POSTGRES_URL!)

export type Task = {
  id: number
  user_id: string
  title: string
  description: string | null
  column_name: string
  position: number
  week_start_date: string | null
  parent_id: number | null
  is_moved_to_hitlist: boolean
  created_at: string
  updated_at: string
}
