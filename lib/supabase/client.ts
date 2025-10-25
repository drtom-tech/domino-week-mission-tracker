import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === "" || supabaseAnonKey.trim() === "") {
    console.warn(
      "[v0] Supabase environment variables are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the Vars section.",
    )
    return null
  }

  try {
    new URL(supabaseUrl)
  } catch {
    console.error("[v0] Invalid NEXT_PUBLIC_SUPABASE_URL format. Must be a valid HTTP or HTTPS URL.")
    return null
  }

  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    return null
  }
}
