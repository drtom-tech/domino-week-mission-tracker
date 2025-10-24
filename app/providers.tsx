"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { MockAuthProvider } from "@/lib/mock-auth"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [isPreview, setIsPreview] = useState<boolean | null>(null)

  useEffect(() => {
    setIsPreview(window.location.hostname.includes("v0.app"))
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

  return (
    <SessionProvider>
      <MockAuthProvider>
        {children}
        <Toaster />
      </MockAuthProvider>
    </SessionProvider>
  )
}
