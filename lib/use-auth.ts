"use client"

import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { useMockAuth } from "./mock-auth"

// Detect if we're in v0 preview environment
const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export function useAuth() {
  const nextAuthSession = useSession()
  const mockAuth = useMockAuth()

  if (isPreview) {
    return {
      user: mockAuth.user,
      isLoading: mockAuth.isLoading,
      signOut: mockAuth.signOut,
    }
  }

  return {
    user: nextAuthSession.data?.user || null,
    isLoading: nextAuthSession.status === "loading",
    signOut: () => nextAuthSignOut({ callbackUrl: "/auth/signin" }),
  }
}
