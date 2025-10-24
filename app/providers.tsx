"use client"

import type React from "react"
import { MockAuthProvider } from "@/lib/mock-auth"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [isPreview, setIsPreview] = useState<boolean | null>(null)
  const [SessionProvider, setSessionProvider] = useState<any>(null)

  useEffect(() => {
    const preview = window.location.hostname.includes("v0.app")
    setIsPreview(preview)

    if (!preview) {
      import("next-auth/react").then((mod) => {
        setSessionProvider(() => mod.SessionProvider)
      })
    }
  }, [])

  if (isPreview === null) {
    return null
  }

  if (isPreview) {
    return (
      <MockAuthProvider>
        {children}
        <Toaster />
      </MockAuthProvider>
    )
  }

  if (!SessionProvider) {
    return null
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
