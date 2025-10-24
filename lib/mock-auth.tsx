"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name?: string
}

interface MockAuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined)

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] MockAuthProvider initializing")
    // Check for stored user on mount
    const storedUser = localStorage.getItem("mock-auth-user")
    if (storedUser) {
      console.log("[v0] Found stored user:", storedUser)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log("[v0] MockAuth signIn called with:", email)
    // Mock sign in - in preview, just create a user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
    }
    console.log("[v0] Created mock user:", mockUser)
    setUser(mockUser)
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    console.log("[v0] Saved user to localStorage")
  }

  const signUp = async (email: string, password: string, name?: string) => {
    console.log("[v0] MockAuth signUp called with:", email, name)
    // Mock sign up - in preview, just create a user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split("@")[0],
    }
    console.log("[v0] Created mock user:", mockUser)
    setUser(mockUser)
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    console.log("[v0] Saved user to localStorage")
  }

  const signOut = async () => {
    console.log("[v0] MockAuth signOut called")
    setUser(null)
    localStorage.removeItem("mock-auth-user")
  }

  console.log("[v0] MockAuthProvider rendering, user:", user, "isLoading:", isLoading)

  return (
    <MockAuthContext.Provider value={{ user, signIn, signUp, signOut, isLoading }}>{children}</MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  const context = useContext(MockAuthContext)
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider")
  }
  return context
}
