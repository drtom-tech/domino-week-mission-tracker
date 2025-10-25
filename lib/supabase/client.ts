"use client"

import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  // Return existing instance if it exists (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if one doesn't exist
  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )

  return supabaseInstance
}
