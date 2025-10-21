"use client"

import { createContext, useContext, type ReactNode } from "react"

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

// Main provider component
export default function NextAuthProvider({ children }: { children: ReactNode }) {
  // Always use mock provider to avoid NextAuth crypto errors in preview
  return <MockSessionProvider>{children}</MockSessionProvider>
}
