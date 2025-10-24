"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Mission and Door</h1>

        {status === "loading" ? (
          <Button size="lg" disabled>
            Loading...
          </Button>
        ) : !session ? (
          <Link href="/auth/signin">
            <Button size="lg">Sign in to continue</Button>
          </Link>
        ) : (
          <Link href="/dashboard">
            <Button size="lg">Go to your dashboard</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
