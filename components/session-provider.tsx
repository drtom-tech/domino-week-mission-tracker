"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useState, useEffect } from "react"

const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true"

// Mock session type matching NextAuth's Session type
type MockSession = {
  user: {
    id: string
    email: string
    name: string
    image?: string
  }
  expires: string
}

type SessionContextValue = {
  data: MockSession | null
  status: "loading" | "authenticated" | "unauthenticated"
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
})

export function useSession() {
  return useContext(SessionContext)
}

function MockSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null)
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  useEffect(() => {
    // Check if user is logged in (stored in localStorage for preview)
    const isLoggedIn = localStorage.getItem("preview-auth") === "true"

    if (isLoggedIn) {
      setSession({
        user: {
          id: "preview-user-1",
          email: "test@example.com",
          name: "Preview User",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      setStatus("authenticated")
    } else {
      setSession(null)
      setStatus("unauthenticated")
    }
  }, [])

  return <SessionContext.Provider value={{ data: session, status }}>{children}</SessionContext.Provider>
}

function RealSessionProvider({ children }: { children: ReactNode }) {
  const [SessionProvider, setSessionProvider] = useState<any>(null)

  useEffect(() => {
    import("next-auth/react").then((mod) => {
      setSessionProvider(() => mod.SessionProvider)
    })
  }, [])

  if (!SessionProvider) {
    return <>{children}</>
  }

  return <SessionProvider>{children}</SessionProvider>
}

export function NextAuthProvider({ children }: { children: ReactNode }) {
  if (IS_PREVIEW) {
    return <MockSessionProvider>{children}</MockSessionProvider>
  }

  return <RealSessionProvider>{children}</RealSessionProvider>
}
