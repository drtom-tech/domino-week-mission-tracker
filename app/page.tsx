"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Mission and Door</h1>

        {loading ? (
          <Button size="lg" disabled>
            Loading...
          </Button>
        ) : !user ? (
          <Link href="/auth/login">
            <Button size="lg">Sign in to continue</Button>
          </Link>
        ) : (
          <Link href="/dashboard">
            <Button size="lg">Go to your dashboard</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
