"use client"
import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Session = {
  user: {
    id: string
    email: string
    name: string
    image: string | null
  }
  expires: string
} | null

type SessionContextValue = {
  data: Session
  status: "loading" | "authenticated" | "unauthenticated"
}

const MockSessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
})

// Mock session for preview mode
const mockSession = {
  user: {
    id: "preview-user-1",
    email: "preview@example.com",
    name: "Preview User",
    image: null,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

function MockSessionProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const value: SessionContextValue = {
    data: mounted ? mockSession : null,
    status: mounted ? "authenticated" : "loading",
  }

  return <MockSessionContext.Provider value={value}>{children}</MockSessionContext.Provider>
}

export function useMockSession() {
  return useContext(MockSessionContext)
}

export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <MockSessionProvider>{children}</MockSessionProvider>
}
