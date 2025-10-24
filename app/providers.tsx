"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { MockAuthProvider } from "@/lib/mock-auth"
import { Toaster } from "@/components/ui/sonner"

// Detect if we're in v0 preview environment
const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export function Providers({ children }: { children: React.ReactNode }) {
  if (isPreview) {
    return (
      <MockAuthProvider>
        {children}
        <Toaster />
      </MockAuthProvider>
    )
  }

  return (
    <SessionProvider>
      <MockAuthProvider>
        {children}
        <Toaster />
      </MockAuthProvider>
    </SessionProvider>
  )
}
