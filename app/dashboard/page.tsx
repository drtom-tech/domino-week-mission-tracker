"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Menu } from "lucide-react"
import useSWR from "swr"
import { getTasks } from "../actions/tasks"
import { formatWeekStart, addWeeks, parseDateLocal } from "@/lib/utils"
import { useState, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"

export default function Home() {
  const [baseWeekStart, setBaseWeekStart] = useState<string>(() => formatWeekStart(new Date()))
  const [weekOffset, setWeekOffset] = useState(0)

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
  } = useSWR(currentWeekStart ? ["tasks", currentWeekStart] : null, () => getTasks(currentWeekStart), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

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
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="ghost">Sign In</Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
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
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
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
