"use client"

import { useUnifiedSession } from "@/components/NextAuthProvider"
import { signIn, signOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useUnifiedSession()

  const user = session?.user ?? null

  return {
    data: session,
    status: status,
    user: user,
    signIn: signIn,
    signOut: signOut,
  }
}
