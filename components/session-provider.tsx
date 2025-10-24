"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useState, useEffect } from "react"

const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE !== "false"

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
    console.log("[v0] MockSessionProvider initialized - Preview Mode Active")

    // Check if user is logged in (stored in localStorage for preview)
    const isLoggedIn = localStorage.getItem("preview-auth") === "true"
    console.log("[v0] Preview auth status:", isLoggedIn)

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

export function NextAuthProvider({ children }: { children: ReactNode }) {
  const [RealProvider, setRealProvider] = useState<any>(null)

  console.log("[v0] NextAuthProvider - IS_PREVIEW:", IS_PREVIEW)

  useEffect(() => {
    if (!IS_PREVIEW) {
      console.log("[v0] Loading real NextAuth provider for production")
      import("next-auth/react")
        .then((mod) => {
          setRealProvider(() => mod.SessionProvider)
        })
        .catch((err) => {
          console.error("[v0] Failed to load NextAuth:", err)
        })
    }
  }, [])

  if (IS_PREVIEW) {
    return <MockSessionProvider>{children}</MockSessionProvider>
  }

  if (!RealProvider) {
    return <SessionContext.Provider value={{ data: null, status: "loading" }}>{children}</SessionContext.Provider>
  }

  return <RealProvider>{children}</RealProvider>
}
