"use client"

import type React from "react"

import { KanbanBoard } from "@/components/kanban-board"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Menu, LogOut, Chrome } from "lucide-react"
import useSWR from "swr"
import { getTasks } from "../actions/tasks"
import { formatWeekStart, addWeeks, parseDateLocal } from "@/lib/utils"
import { useState, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/use-auth"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

export default function Home() {
  const { user, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [baseWeekStart, setBaseWeekStart] = useState<string>(() => formatWeekStart(new Date()))
  const [weekOffset, setWeekOffset] = useState(0)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleWeekOffsetChange = (newOffset: number) => {
    console.log("[v0] Week offset changing from", weekOffset, "to", newOffset)
    console.trace("[v0] Week offset change stack trace")
    setWeekOffset(newOffset)
  }

  const currentWeekStart = useMemo(() => {
    if (!baseWeekStart) return ""
    if (weekOffset === 0) return baseWeekStart

    const base = parseDateLocal(baseWeekStart)
    const offsetDate = addWeeks(base, weekOffset)
    const result = formatWeekStart(offsetDate)
    console.log("[v0] Calculated currentWeekStart:", result, "from weekOffset:", weekOffset)
    return result
  }, [baseWeekStart, weekOffset])

  const {
    data: tasks,
    error,
    isLoading,
    mutate,
  } = useSWR(currentWeekStart && user ? ["tasks", currentWeekStart] : null, () => getTasks(currentWeekStart), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      toast.error("Failed to sign in with Google")
      setIsSigningIn(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSigningIn(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("An error occurred during sign in")
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSigningIn(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    try {
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

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Account created but failed to sign in. Please try signing in manually.")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Sign up error:", error)
      toast.error("An error occurred during sign up")
    } finally {
      setIsSigningIn(false)
    }
  }

  if (authLoading) {
    console.log("[v0] Dashboard showing loading state")
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Mission and Door</CardTitle>
            <CardDescription className="text-center">Sign in to access your kanban board</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
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

                <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSigningIn}>
                    {isSigningIn ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
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

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name (optional)</Label>
                    <Input id="signup-name" name="name" type="text" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSigningIn}>
                    {isSigningIn ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Tasks</AlertTitle>
          <AlertDescription className="mt-2">
            <p>There was an error loading your tasks. Please try refreshing the page.</p>
            <p className="mt-2 text-sm text-muted-foreground">If this problem persists, please contact support.</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if ((isLoading && !tasks) || !currentWeekStart) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl md:text-2xl font-bold">
                <span className="md:hidden">PK</span>
                <span className="hidden md:inline">Personal Kanban</span>
              </h1>
              <div className="flex-1 flex justify-center">
                <div id="week-nav-container"></div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/mission" className="hidden md:block">
                  <Button variant="outline">Mission Board</Button>
                </Link>
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={(user as any).image || ""} alt={user.name || ""} />
                          <AvatarFallback>{user.name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-2">
                      <Link href="/mission">
                        <Button variant="outline" className="w-full bg-transparent">
                          Mission Board
                        </Button>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
        <main>
          <KanbanSkeleton />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="md:hidden">PK</span>
              <span className="hidden md:inline">Personal Kanban</span>
            </h1>
            <div className="flex-1 flex justify-center">
              <div id="week-nav-container"></div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/mission" className="hidden md:block">
                <Button variant="outline">Mission Board</Button>
              </Link>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any).image || ""} alt={user.name || ""} />
                        <AvatarFallback>{user.name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <Link href="/mission">
                      <Button variant="outline" className="w-full bg-transparent">
                        Mission Board
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main>
        <KanbanBoard
          tasks={tasks || []}
          currentWeekStart={currentWeekStart}
          weekOffset={weekOffset}
          onWeekOffsetChange={handleWeekOffsetChange}
          onTasksChange={() => {
            console.log("[v0] onTasksChange called, current weekOffset:", weekOffset)
            mutate()
          }}
        />
      </main>
    </div>
  )
}
