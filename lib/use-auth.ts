"use client"

import { useMockAuth } from "./mock-auth"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { isPreviewEnvironment } from "./auth-helpers"

export function useAuth() {
  const mockAuth = useMockAuth()
  const sessionResult = useSession()
  const session = sessionResult?.data || null
  const status = sessionResult?.status || "loading"

  const isPreview = isPreviewEnvironment()

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
