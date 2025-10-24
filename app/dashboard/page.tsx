"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Menu } from "lucide-react"
import useSWR from "swr"
import { getTasks } from "../actions/tasks"
import { formatWeekStart, addWeeks, parseDateLocal } from "@/lib/utils"
import { useState, useMemo, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE !== "false"

const MOCK_TASKS = [
  {
    id: 1,
    title: "Review project requirements",
    description: "Go through the project specs and create a task list",
    label: "To-Do" as const,
    column_name: "hot_list",
    position: 0,
    parent_id: null,
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    week_start_date: null,
    linked_task_id: null,
    origin_column: null,
    is_moved_to_hitlist: null,
  },
  {
    id: 2,
    title: "Design database schema",
    description: "Create the initial database design",
    label: "Door" as const,
    column_name: "the_door",
    position: 0,
    parent_id: null,
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    week_start_date: formatWeekStart(new Date()),
    linked_task_id: null,
    origin_column: null,
    is_moved_to_hitlist: null,
  },
  {
    id: 3,
    title: "Setup development environment",
    description: "Install dependencies and configure tools",
    label: "Hit" as const,
    column_name: "hit_list_mon",
    position: 0,
    parent_id: null,
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    week_start_date: formatWeekStart(new Date()),
    linked_task_id: null,
    origin_column: null,
    is_moved_to_hitlist: null,
  },
  {
    id: 4,
    title: "Write unit tests",
    description: "Add test coverage for core functionality",
    label: "Hit" as const,
    column_name: "done",
    position: 0,
    parent_id: null,
    completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    week_start_date: formatWeekStart(new Date()),
    linked_task_id: null,
    origin_column: "hit_list_fri",
    is_moved_to_hitlist: null,
  },
]

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const [baseWeekStart, setBaseWeekStart] = useState<string>(() => formatWeekStart(new Date()))
  const [weekOffset, setWeekOffset] = useState(0)

  const handleWeekOffsetChange = (newOffset: number) => {
    setWeekOffset(newOffset)
  }

  const currentWeekStart = useMemo(() => {
    if (!baseWeekStart) return ""
    if (weekOffset === 0) return baseWeekStart

    const base = parseDateLocal(baseWeekStart)
    const offsetDate = addWeeks(base, weekOffset)
    const result = formatWeekStart(offsetDate)
    return result
  }, [baseWeekStart, weekOffset])

  const {
    data: tasks,
    error,
    isLoading,
    mutate,
  } = useSWR(
    IS_PREVIEW ? null : currentWeekStart ? ["tasks", currentWeekStart] : null,
    IS_PREVIEW ? null : () => getTasks(currentWeekStart),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // Use mock data in preview mode, real data in production
  const displayTasks = IS_PREVIEW ? MOCK_TASKS : tasks || []
  const isLoadingData = !IS_PREVIEW && isLoading && !tasks

  if (loading || !currentWeekStart) {
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
                {loading ? null : !user ? (
                  <Link href="/auth/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                ) : (
                  <Button variant="ghost" onClick={handleSignOut}>
                    Sign Out
                  </Button>
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
      {IS_PREVIEW && (
        <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-sm font-medium">
          PREVIEW MODE - Using mock data. Production uses real database.
        </div>
      )}
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
              {loading ? null : !user ? (
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
              ) : (
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
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
          tasks={displayTasks}
          currentWeekStart={currentWeekStart}
          weekOffset={weekOffset}
          onWeekOffsetChange={handleWeekOffsetChange}
          onTasksChange={() => {
            if (!IS_PREVIEW) {
              mutate()
            }
          }}
        />
      </main>
    </div>
  )
}
