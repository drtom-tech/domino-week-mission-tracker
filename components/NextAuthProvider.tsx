"use client"
import type React from "react"
import { SessionProvider } from "next-auth/react"

export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  const isPreview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.app") || window.location.hostname.includes("vusercontent.net"))

  if (isPreview) {
    // In preview mode, just pass through children without SessionProvider
    return <>{children}</>
  }

  // In production, wrap with SessionProvider
  return <SessionProvider>{children}</SessionProvider>
}
