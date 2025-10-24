"use client"

import type React from "react"
import { MockAuthProvider } from "@/lib/mock-auth"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

  if (isPreview) {
    return (
      <MockAuthProvider>
        {children}
        <Toaster />
      </MockAuthProvider>
    )
  }

  return (
    <MockAuthProvider>
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </MockAuthProvider>
  )
}
