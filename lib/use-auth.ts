"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const DEV_MODE = process.env.NODE_ENV === "development"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Dev mode bypass
    if (DEV_MODE) {
      setUser({
        id: "dev-user-id",
        email: "dev@example.com",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
      } as User)
      setIsLoading(false)
      return
    }

    // Production: Real Supabase auth
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
    try {
      // Dev mode
      if (DEV_MODE) {
        setUser(null)
        router.push("/")
        router.refresh()
        return
      }

      // Production: Proper Supabase signOut
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Sign out error:", error)
        throw error
      }

      // Clear user state
      setUser(null)
      
      // Redirect to home page
      router.push("/")
      
      // Force a hard refresh to clear all state
      router.refresh()
      
      // Optional: Force a full page reload to ensure everything is cleared
      // Uncomment if you still have issues
      // window.location.href = "/"
      
    } catch (error) {
      console.error("Failed to sign out:", error)
      // Even if there's an error, try to clear local state and redirect
      setUser(null)
      router.push("/")
      router.refresh()
    }
  }

  return {
    user,
    isLoading,
    signOut,
  }
}
