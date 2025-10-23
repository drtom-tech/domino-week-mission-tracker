"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useMockAuth } from "@/lib/mock-auth"

const isPreview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("v0.app") || window.location.hostname.includes("vusercontent.net"))

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const mockAuth = useMockAuth()

  useEffect(() => {
    if (isPreview) {
      // Clear any NextAuth cookies that might trigger automatic session fetching
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.trim().split("=")[0]
        if (cookieName.includes("next-auth") || cookieName.includes("__Secure-next-auth")) {
          document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        }
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await mockAuth.signIn(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      window.location.href = "/"
    }
  }

  const handleGoogleSignIn = async () => {
    console.log("[v0] Google sign-in clicked, isPreview:", isPreview)
    await mockAuth.signInWithGoogle()
    // Redirect after successful sign-in
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {isPreview && (
          <div className="mb-4 p-3 bg-blue-500/10 text-blue-600 rounded text-sm text-center">
            Preview Mode: Any email/password will work
          </div>
        )}

        <Button onClick={handleGoogleSignIn} className="w-full mb-4 bg-transparent" variant="outline">
          Sign in with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">{error}</div>}

          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
