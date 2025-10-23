"use client"

import { useContext, createContext } from "react"

// Create a unified auth context type
interface AuthContextType {
  data: any
  status: "loading" | "authenticated" | "unauthenticated"
}

// Create a unified auth context
export const UnifiedAuthContext = createContext<AuthContextType>({
  data: null,
  status: "loading",
})

// Single hook that works in both environments
export function useAuth() {
  return useContext(UnifiedAuthContext)
}
