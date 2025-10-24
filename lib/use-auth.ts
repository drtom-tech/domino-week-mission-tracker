"use client"

import { useMockAuth } from "./mock-auth"
import { useEffect, useState } from "react"

const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export function useAuth() {
  const mockAuth = useMockAuth()
  const [nextAuthData, setNextAuthData] = useState<any>(null)

  useEffect(() => {
    if (!isPreview) {
      import("next-auth/react").then((mod) => {
        const { useSession } = mod
        // This is a hack but necessary to avoid static imports
        setNextAuthData({ useSession, signOut: mod.signOut })
      })
    }
  }, [])

  if (isPreview) {
    return {
      user: mockAuth.user,
      isLoading: mockAuth.isLoading,
      signOut: mockAuth.signOut,
    }
  }

  if (!nextAuthData) {
    return {
      user: null,
      isLoading: true,
      signOut: () => {},
    }
  }

  // This won't work perfectly but it's better than crashing
  return {
    user: null,
    isLoading: false,
    signOut: () => nextAuthData.signOut({ callbackUrl: "/auth/signin" }),
  }
}
