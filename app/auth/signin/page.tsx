"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMockAuth } from "@/lib/mock-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Chrome } from "lucide-react"

const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

export default function SignInPage() {
  const router = useRouter()
  const mockAuth = useMockAuth()
  const [isLoading, setIsLoading] = useState(false)

  console.log("[v0] SignInPage - isPreview:", isPreview)

  const handleGoogleSignIn = async () => {
    if (isPreview) {
      toast.info("Google OAuth is not available in preview. Use email/password instead.")
      return
    }

    setIsLoading(true)
    try {
      const { signIn } = await import("next-auth/react")
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      toast.error("Failed to sign in with Google")
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("[v0] Attempting sign in with:", email)

    try {
      if (isPreview) {
        console.log("[v0] Using mock auth for sign in")
        await mockAuth.signIn(email, password)
        console.log("[v0] Mock auth sign in successful, user:", mockAuth.user)
        toast.success("Signed in successfully!")
        router.push("/")
        router.refresh()
      } else {
        const { signIn } = await import("next-auth/react")
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          toast.error("Invalid email or password")
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (error) {
      console.error("[v0] Sign in error:", error)
      toast.error("An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    console.log("[v0] Attempting sign up with:", email)

    try {
      if (isPreview) {
        console.log("[v0] Using mock auth for sign up")
        await mockAuth.signUp(email, password, name)
        console.log("[v0] Mock auth sign up successful, user:", mockAuth.user)
        toast.success("Account created successfully!")
        router.push("/")
        router.refresh()
      } else {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || "Failed to create account")
          return
        }

        toast.success("Account created! Signing you in...")

        const { signIn } = await import("next-auth/react")
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          toast.error("Account created but failed to sign in. Please try signing in manually.")
        } else {
          router.push("/")
          router.refresh()
        }
      }
    } catch (error) {
      console.error("[v0] Sign up error:", error)
      toast.error("An error occurred during sign up")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Mission and Door</CardTitle>
          <CardDescription className="text-center">
            {isPreview ? "Preview Mode - Sign in with any email/password" : "Sign in to access your kanban board"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              {!isPreview && (
                <>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder={isPreview ? "any@email.com" : "you@example.com"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder={isPreview ? "any password" : ""}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              {!isPreview && (
                <>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <Input id="signup-name" name="name" type="text" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder={isPreview ? "any@email.com" : "you@example.com"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder={isPreview ? "any password" : ""}
                    required
                    minLength={isPreview ? 1 : 6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
