"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import dynamic from "next/dynamic"

// Mock session type matching NextAuth's Session type
type MockSession = {
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  expires: string
}

type MockSessionContextType = {
  data: MockSession | null
  status: "authenticated" | "loading" | "unauthenticated"
}

const MockSessionContext = createContext<MockSessionContextType>({
  data: null,
  status: "unauthenticated",
})

// Hook to access mock session
export function useMockSession() {
  return useContext(MockSessionContext)
}

// Mock session provider for preview mode
export function MockSessionProvider({ children }: { children: ReactNode }) {
  // Provide a mock authenticated session for preview
  const mockSession: MockSession = {
    user: {
      id: "1",
      name: "Preview User",
      email: "preview@example.com",
      image: undefined,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  return (
    <MockSessionContext.Provider
      value={{
        data: mockSession,
        status: "authenticated",
      }}
    >
      {children}
    </MockSessionContext.Provider>
  )
}

function isPreviewMode() {
  if (typeof window === "undefined") return false
  const hostname = window.location.hostname

  // Only v0.app and localhost are preview mode
  // Production Vercel URLs (*.vercel.app) should use real NextAuth
  // v0.app = v0 preview, vusercontent.net = Vercel preview deployments, localhost = local dev
  const isV0Preview =
    hostname.includes("v0.app") || hostname.includes("vusercontent.net") || hostname.includes("localhost")

  console.log("[v0] Preview Mode Detection:", {
    hostname,
    isV0Preview,
  })

  return isV0Preview
}

const RealSessionProvider = dynamic(() => import("next-auth/react").then((mod) => mod.SessionProvider), {
  ssr: false,
  loading: () => null,
})

// Main provider component
export default function NextAuthProvider({ children }: { children: ReactNode }) {
  const [isPreview, setIsPreview] = useState(true) // Default to preview to avoid flash

  useEffect(() => {
    const preview = isPreviewMode()
    console.log("[v0] NextAuthProvider - Setting preview mode:", preview)
    setIsPreview(preview)
  }, [])

  if (isPreview) {
    console.log("[v0] Using MockSessionProvider")
    return <MockSessionProvider>{children}</MockSessionProvider>
  }

  console.log("[v0] Using RealSessionProvider (NextAuth)")
  return <RealSessionProvider>{children}</RealSessionProvider>
}
