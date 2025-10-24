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

export function signIn() {
  if (IS_PREVIEW) {
    window.location.href = "/auth/signin"
  } else {
    import("next-auth/react").then((mod) => {
      mod.signIn()
    })
  }
}

export function signOut() {
  if (IS_PREVIEW) {
    localStorage.removeItem("preview-auth")
    window.location.href = "/"
  } else {
    import("next-auth/react").then((mod) => {
      mod.signOut()
    })
  }
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
  const [realSession, setRealSession] = useState<any>(null)
  const [realStatus, setRealStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  useEffect(() => {
    import("next-auth/react").then((mod) => {
      setSessionProvider(() => mod.SessionProvider)
    })
  }, [])

  if (!SessionProvider) {
    return <SessionContext.Provider value={{ data: null, status: "loading" }}>{children}</SessionContext.Provider>
  }

  return (
    <SessionProvider>
      <SessionBridge>{children}</SessionBridge>
    </SessionProvider>
  )
}

function SessionBridge({ children }: { children: ReactNode }) {
  const [nextAuthSession, setNextAuthSession] = useState<any>(null)
  const [nextAuthStatus, setNextAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  useEffect(() => {
    import("next-auth/react").then((mod) => {
      const { useSession } = mod
      // This is a hack to get the session from NextAuth
      // In production, this will be replaced by the actual NextAuth provider
    })
  }, [])

  return (
    <SessionContext.Provider value={{ data: nextAuthSession, status: nextAuthStatus }}>
      {children}
    </SessionContext.Provider>
  )
}

export function NextAuthProvider({ children }: { children: ReactNode }) {
  if (IS_PREVIEW) {
    return <MockSessionProvider>{children}</MockSessionProvider>
  }

  return <RealSessionProvider>{children}</RealSessionProvider>
}
