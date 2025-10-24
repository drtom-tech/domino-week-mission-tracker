"use client"

import type React from "react"
import { MockAuthProvider } from "@/lib/mock-auth"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "next-auth/react"
import { isPreviewEnvironment } from "@/lib/auth-helpers"

export function Providers({ children }: { children: React.ReactNode }) {
  const isPreview = isPreviewEnvironment()

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
