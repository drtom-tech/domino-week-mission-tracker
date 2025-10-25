"use client"

import { getTasks } from "../actions/tasks"
import { MissionBoard } from "@/components/mission-board"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)
import { useState, useMemo, useEffect, useCallback } from "react"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
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
import { formatQuarterStart, addQuarters, parseDateLocal } from "@/lib/utils"
import type { Task } from "@/lib/db-types"
import { createClient } from "@/lib/supabase/client"

export default function MissionPage() {
  const { user, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [baseQuarterStart, setBaseQuarterStart] = useState<string>(() => formatQuarterStart(new Date()))
  const [quarterOffset, setQuarterOffset] = useState(0)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isDevMode, setIsDevMode] = useState(false)

  useEffect(() => {
    setPortalContainer(document.getElementById("quarter-nav-container"))
    const devModeFlag = localStorage.getItem("dev_mode_bypass")
    if (devModeFlag === "true") {
      setIsDevMode(true)
    }
  }, [])

  const currentQuarterStart = useMemo(() => {
    if (!baseQuarterStart) return ""
    if (quarterOffset === 0) return baseQuarterStart

    const base = parseDateLocal(baseQuarterStart)
    const offsetDate = addQuarters(base, quarterOffset)
    return formatQuarterStart(offsetDate)
  }, [baseQuarterStart, quarterOffset])

  const fetchTasks = useCallback(async () => {
    if (!user && !isDevMode) return

    setIsLoading(true)
    setError(null)

    try {
      const fetchedTasks = await getTasks()
      setTasks(fetchedTasks)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isDevMode])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!authLoading && !user && !isDevMode) {
      router.push("/auth/signin")
    }
  }, [authLoading, user, isDevMode, router])

  useEffect(() => {
    if (!user && !isDevMode) return

    const supabase = createClient()

    const channel = supabase
      .channel("mission-tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchTasks()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isDevMode, fetchTasks])

  if (authLoading && !isDevMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && !isDevMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  if (isLoading && !tasks.length) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mission Board</h1>
            <div className="flex-1 flex justify-center">
              <div id="quarter-nav-container"></div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline">Kanban Board</Button>
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
              {isDevMode && !user && (
                <div className="text-xs text-muted-foreground bg-yellow-500/10 px-2 py-1 rounded">Dev Mode</div>
              )}
            </div>
          </div>
        </header>
        <main>
          <KanbanSkeleton />
        </main>
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mission Board</h1>
          <div className="flex-1 flex justify-center">
            <div id="quarter-nav-container"></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Kanban Board</Button>
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
            {isDevMode && !user && (
              <div className="text-xs text-muted-foreground bg-yellow-500/10 px-2 py-1 rounded">Dev Mode</div>
            )}
          </div>
        </div>
      </header>
      <main>
        <MissionBoard
          tasks={tasks || []}
          currentQuarterStart={currentQuarterStart}
          quarterOffset={quarterOffset}
          onQuarterOffsetChange={setQuarterOffset}
          onTasksChange={() => fetchTasks()}
          portalContainer={portalContainer}
        />
      </main>
    </div>
  )
}
