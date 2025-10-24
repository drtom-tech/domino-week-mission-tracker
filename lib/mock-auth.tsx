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
    // Check for stored user on mount
    const storedUser = localStorage.getItem("mock-auth-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock sign in - in preview, just create a user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
    }
    setUser(mockUser)
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
  }

  const signUp = async (email: string, password: string, name?: string) => {
    // Mock sign up - in preview, just create a user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split("@")[0],
    }
    setUser(mockUser)
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem("mock-auth-user")
  }

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
