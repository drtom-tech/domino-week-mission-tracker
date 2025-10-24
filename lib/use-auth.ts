"use client"

import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import { useMockAuth } from "./mock-auth"
import { useState, useEffect } from "react"

export function useAuth() {
  const mockAuth = useMockAuth()
  const { data: session, status } = useSession()
  const [isPreview, setIsPreview] = useState<boolean | null>(null)

  useEffect(() => {
    setIsPreview(typeof window !== "undefined" && window.location.hostname.includes("v0.app"))
  }, [])

  if (isPreview === true) {
    return {
      user: mockAuth.user,
      isLoading: mockAuth.isLoading,
      signOut: mockAuth.signOut,
    }
  }

  if (isPreview === false) {
    return {
      user: session?.user || null,
      isLoading: status === "loading",
      signOut: () => nextAuthSignOut({ callbackUrl: "/auth/signin" }),
    }
  }

  return {
    user: null,
    isLoading: true,
    signOut: async () => {},
  }
}
