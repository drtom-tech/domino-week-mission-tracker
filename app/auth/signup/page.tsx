"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { signUpWithCredentials, signInWithGoogle } from "@/lib/auth-helpers"

const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signUpWithCredentials(email, password, name)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      if (isPreview) {
        window.location.href = "/"
      } else {
        setSuccess(true)
      }
    }
  }

  const handleGoogleSignUp = async () => {
    await signInWithGoogle()
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Check Your Email</h1>
          <p className="text-center text-muted-foreground mb-6">
            We've sent a verification link to <strong>{email}</strong>. Please check your email to verify your account.
          </p>
          <Link href="/auth/signin">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>

        {isPreview && (
          <div className="mb-4 p-3 bg-blue-500/10 text-blue-600 rounded text-sm text-center">
            Preview Mode: Any email/password will work
          </div>
        )}

        <Button onClick={handleGoogleSignUp} className="w-full mb-4 bg-transparent" variant="outline">
          Sign up with Google
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

          <Input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />

          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
