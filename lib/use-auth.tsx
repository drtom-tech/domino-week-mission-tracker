"use client"

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
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
  const realSession = useSession()
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

  const inPreview = isPreviewMode()

  if (inPreview) {
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

  // Production: use real NextAuth
  return {
    data: realSession.data,
    status: realSession.status,
    user: realSession.data?.user || null,
    signIn: nextAuthSignIn,
    signOut: nextAuthSignOut,
  }
}
