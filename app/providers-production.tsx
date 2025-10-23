"use client"

import type React from "react"
import { SessionProvider, useSession } from "next-auth/react"
import type { Session } from "next-auth"
import { UnifiedAuthContext } from "@/lib/use-auth"

function ProductionAuthContextProvider({ children }: { children: React.ReactNode }) {
  const realSession = useSession()
  return <UnifiedAuthContext.Provider value={realSession}>{children}</UnifiedAuthContext.Provider>
}

export function ProductionProviders({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <ProductionAuthContextProvider>{children}</ProductionAuthContextProvider>
    </SessionProvider>
  )
}
