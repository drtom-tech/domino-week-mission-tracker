"use client"

import type React from "react"
import { MockAuthProvider, useMockSession } from "@/lib/mock-auth"
import { UnifiedAuthContext } from "@/lib/use-auth"
import { useEffect, useState } from "react"
import { SessionProvider } from "next-auth/react"

const isV0Preview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("v0.app") || window.location.hostname.includes("vusercontent.net"))

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const mockSession = useMockSession()
  const [productionSession, setProductionSession] = useState<any>(null)
  const [productionStatus, setProductionStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // In production, fetch session from NextAuth
  useEffect(() => {
    if (!isClient) return

    if (isV0Preview) {
      // Clear any NextAuth cookies in preview
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.trim().split("=")[0]
        if (cookieName.includes("next-auth") || cookieName.includes("__Secure-next-auth")) {
          document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        }
      })
    } else {
      // In production, fetch session from NextAuth API
      const fetchSession = async () => {
        try {
          const response = await fetch("/api/auth/session")
          if (response.ok) {
            const session = await response.json()
            setProductionSession(session)
            setProductionStatus(session ? "authenticated" : "unauthenticated")
          } else {
            setProductionSession(null)
            setProductionStatus("unauthenticated")
          }
        } catch (error) {
          console.error("[v0] Error fetching session:", error)
          setProductionSession(null)
          setProductionStatus("unauthenticated")
        }
      }

      fetchSession()

      // Poll for session changes every 5 seconds
      const interval = setInterval(fetchSession, 5000)
      return () => clearInterval(interval)
    }
  }, [isClient])

  // Use mock session in preview, production session in production
  const session = isV0Preview ? mockSession : { data: productionSession, status: productionStatus }

  return <UnifiedAuthContext.Provider value={session}>{children}</UnifiedAuthContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (isV0Preview) {
    return (
      <MockAuthProvider>
        <AuthContextProvider>{children}</AuthContextProvider>
      </MockAuthProvider>
    )
  }

  return (
    <SessionProvider>
      <MockAuthProvider>
        <AuthContextProvider>{children}</AuthContextProvider>
      </MockAuthProvider>
    </SessionProvider>
  )
}
