"use client"

import { useEffect, useState } from "react"
import { useMockSession } from "@/components/NextAuthProvider"

// Detect if we're in v0 preview mode
function isPreviewMode() {
  if (typeof window === "undefined") return false

  const hostname = window.location.hostname

  return hostname.includes("vusercontent.net") || hostname.includes("v0.app")
}

export function useAuth() {
  const mockSession = useMockSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Server-side: return loading state
  if (!mounted) {
    return {
      data: null,
      status: "loading" as const,
      user: null,
      signIn: async () => {},
      signOut: async () => {},
    }
  }

  return {
    data: mockSession.data,
    status: mockSession.status,
    user: mockSession.data?.user || null,
    signIn: async (provider?: string) => {
      console.log("[v0] Preview Mode - Mock sign in with provider:", provider)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { ok: true, error: null, status: 200, url: null }
    },
    signOut: async () => {
      console.log("[v0] Preview Mode - Mock sign out")
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
  }
}
