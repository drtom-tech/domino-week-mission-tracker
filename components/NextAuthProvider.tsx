"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import dynamic from "next/dynamic"
import { useSession as useNextAuthSession } from "next-auth/react"
import type { Session } from "next-auth"

// Mock Session Context Type
type MockSessionContextType = {
  data: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
  update: () => Promise<Session | null>
}

const MockSessionContext = createContext<MockSessionContextType>({
  data: null,
  status: "loading",
  update: async () => null,
})

// Mock Session Provider
export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [session] = useState<Session | null>({
    user: {
      id: "preview-user",
      email: "preview@example.com",
      name: "Preview User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  const mockContext: MockSessionContextType = {
    data: session,
    status: "authenticated",
    update: async () => session,
  }

  return <MockSessionContext.Provider value={mockContext}>{children}</MockSessionContext.Provider>
}

// Hook to use mock session
export function useMockSession() {
  return useContext(MockSessionContext)
}

// Dynamic import of real SessionProvider
const RealSessionProvider = dynamic(() => import("next-auth/react").then((mod) => mod.SessionProvider), { ssr: false })

// Detect preview mode
function shouldUseMockProvider(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  const hostname = window.location.hostname
  const useMock = hostname.includes("v0.app") || hostname.includes("localhost") || hostname.includes("vusercontent.net")

  console.log("[v0] Should use mock provider?", { hostname, useMock })
  return useMock
}

// Main provider component
export default function NextAuthProvider({ children }: { children: ReactNode }) {
  const [useMock, setUseMock] = useState<boolean | null>(null)

  useEffect(() => {
    setUseMock(shouldUseMockProvider())
  }, [])

  if (useMock === null) {
    console.log("[v0] Initializing provider check...")
    return null
  }

  if (useMock) {
    console.log("[v0] Using MockSessionProvider")
    return <MockSessionProvider>{children}</MockSessionProvider>
  }

  console.log("[v0] Using RealSessionProvider (NextAuth)")
  return <RealSessionProvider>{children}</RealSessionProvider>
}

export function useUnifiedSession() {
  const [isPreview, setIsPreview] = useState<boolean | null>(null)

  useEffect(() => {
    setIsPreview(shouldUseMockProvider())
  }, [])

  // Get mock session (always available)
  const mockSession = useMockSession()

  // Get real session (only works when RealSessionProvider is active)
  const realSession = useNextAuthSession()

  // Return appropriate session based on environment
  if (isPreview === null) {
    return { data: null, status: "loading" as const, update: async () => null }
  }

  if (isPreview) {
    return mockSession
  }

  return realSession
}
