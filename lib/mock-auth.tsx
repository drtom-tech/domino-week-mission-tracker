"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Mock session type matching NextAuth
interface MockSession {
  user: {
    id: string
    email: string
    name: string
  }
  expires: string
}

interface MockAuthContextType {
  data: MockSession | null
  status: "loading" | "authenticated" | "unauthenticated"
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null)
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  // Check for existing session in localStorage on mount and listen for storage events
  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem("mock-auth-user")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          const mockSession: MockSession = {
            user,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
          setSession(mockSession)
          setStatus("authenticated")
        } catch {
          setStatus("unauthenticated")
        }
      } else {
        setSession(null)
        setStatus("unauthenticated")
      }
    }

    // Check on mount
    checkSession()

    // Listen for storage events (from other tabs or manual updates)
    window.addEventListener("storage", checkSession)

    return () => {
      window.removeEventListener("storage", checkSession)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock validation
    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    const user = {
      id: "mock-user-" + Date.now(),
      email,
      name: email.split("@")[0],
    }

    localStorage.setItem("mock-auth-user", JSON.stringify(user))

    const mockSession: MockSession = {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    setSession(mockSession)
    setStatus("authenticated")

    return {}
  }

  const signInWithGoogle = async () => {
    const user = {
      id: "mock-google-user-" + Date.now(),
      email: "demo@google.com",
      name: "Demo User",
    }

    localStorage.setItem("mock-auth-user", JSON.stringify(user))

    const mockSession: MockSession = {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    setSession(mockSession)
    setStatus("authenticated")
  }

  const signOut = async () => {
    localStorage.removeItem("mock-auth-user")
    setSession(null)
    setStatus("unauthenticated")
  }

  const signUp = async (email: string, password: string, name: string) => {
    // Mock validation
    if (!email || !password || !name) {
      return { error: "All fields are required" }
    }

    const user = {
      id: "mock-user-" + Date.now(),
      email,
      name,
    }

    localStorage.setItem("mock-auth-user", JSON.stringify(user))

    const mockSession: MockSession = {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    setSession(mockSession)
    setStatus("authenticated")

    return {}
  }

  return (
    <MockAuthContext.Provider
      value={{
        data: session,
        status,
        signIn,
        signInWithGoogle,
        signOut,
        signUp,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    return {
      data: null,
      status: "unauthenticated" as const,
      signIn: async () => ({ error: "Auth not initialized" }),
      signInWithGoogle: async () => {},
      signOut: async () => {},
      signUp: async () => ({ error: "Auth not initialized" }),
    }
  }
  return context
}

// Hook that mimics useSession from next-auth
export function useMockSession() {
  const auth = useMockAuth()
  return {
    data: auth?.data ?? null,
    status: auth?.status ?? ("unauthenticated" as const),
  }
}
