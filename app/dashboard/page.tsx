"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getTasks } from "../actions/tasks"
import { formatWeekStart, addWeeks, parseDateLocal } from "@/lib/utils"
import { useState, useMemo, useEffect, useCallback } from "react"
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
import type { Task } from "@/lib/db-types"

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)

export default function Home() {
  const { user, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [baseWeekStart, setBaseWeekStart] = useState<string>(() => formatWeekStart(new Date()))
  const [weekOffset, setWeekOffset] = useState(0)

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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

  const fetchTasks = useCallback(async () => {
    if (!currentWeekStart || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const fetchedTasks = await getTasks(currentWeekStart)
      setTasks(fetchedTasks)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [currentWeekStart, user])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [authLoading, user, router])

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircleIcon />
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
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOutIcon />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <MenuIcon />
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
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOutIcon />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <MenuIcon />
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
            fetchTasks()
          }}
        />
      </main>
    </div>
  )
}
