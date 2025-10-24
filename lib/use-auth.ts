"use client"

import { useMockAuth } from "./mock-auth"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"

const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export function useAuth() {
  const mockAuth = useMockAuth()
  const { data: session, status } = useSession()

  if (isPreview) {
    return {
      user: mockAuth.user,
      isLoading: mockAuth.isLoading,
      signOut: mockAuth.signOut,
    }
  }

  return {
    user: session?.user || null,
    isLoading: status === "loading",
    signOut: async () => {
      await nextAuthSignOut({ callbackUrl: "/auth/signin" })
    },
  }
}
