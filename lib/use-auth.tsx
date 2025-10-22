"use client"

import { useMockSession } from "@/components/NextAuthProvider"

// Mock sign in/out functions for preview mode
const mockSignIn = async () => {
  console.log("[v0] Mock sign in called")
  return undefined
}

const mockSignOut = async () => {
  console.log("[v0] Mock sign out called")
  return undefined
}

export function useAuth() {
  const { data: session, status } = useMockSession()

  const user = session?.user ?? null

  return {
    data: session,
    status: status,
    user: user,
    signIn: mockSignIn,
    signOut: mockSignOut,
  }
}
