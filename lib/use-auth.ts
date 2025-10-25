"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured. Please add environment variables.")
      setIsLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    if (!supabase) return

    await supabase.auth.signOut()
    router.push("/auth/signin")
    router.refresh()
  }

  return {
    user,
    isLoading,
    signOut,
    error,
  }
}
