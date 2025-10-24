"use client"

import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { useMockAuth } from "./mock-auth"
import { useEffect, useState } from "react"

const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export function useAuth() {
  const mockAuth = useMockAuth()
  const nextAuthSession = useSession()
  const [authSession, setAuthSession] = useState({ data: null, status: "unauthenticated" as const })

  useEffect(() => {
    if (!isPreview) {
      setAuthSession(nextAuthSession)
    }
  }, [isPreview, nextAuthSession])

  if (isPreview) {
    return {
      user: mockAuth.user,
      isLoading: mockAuth.isLoading,
      signOut: mockAuth.signOut,
    }
  }

  return {
    user: authSession.data?.user || null,
    isLoading: authSession.status === "loading",
    signOut: () => nextAuthSignOut({ callbackUrl: "/auth/signin" }),
  }
}
