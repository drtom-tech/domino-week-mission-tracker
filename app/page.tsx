"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/use-auth"
import { useRouter } from "next/navigation"
import { getTasks } from "./actions/tasks"
import { KanbanBoard } from "@/components/kanban-board"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, LogOut } from "lucide-react"
import useSWR from "swr"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { signOutUser } from "@/lib/auth-helpers"

export default function HomePage() {
  const { data: session, status } = useAuth()
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const {
    data: tasks,
    error,
    isLoading,
    mutate,
  } = useSWR(status === "authenticated" ? "kanban-tasks" : null, () => getTasks(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const handleSignOut = async () => {
    await signOutUser()
  }

  // Calculate current week start date based on offset
  const getCurrentWeekStart = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Monday is 1
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString().split("T")[0]
  }

  const currentWeekStart = getCurrentWeekStart()

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <Link href="/mission">
              <Button variant="outline">Mission Board</Button>
            </Link>
          </div>
        </header>
        <main>
          <div id="week-nav-container" className="border-b" />
          <KanbanSkeleton />
        </main>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Not Set Up</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>The database tables haven't been created yet. Please run the SQL script to set up your database:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Look for the "Run Script" button in the chat interface</li>
              <li>
                Click it to execute{" "}
                <code className="bg-muted px-1 py-0.5 rounded">scripts/001_create_tasks_table.sql</code>
              </li>
              <li>Refresh this page once the script completes</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <div className="flex items-center gap-2">
            <Link href="/mission">
              <Button variant="outline">Mission Board</Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main>
        <div id="week-nav-container" className="border-b" />
        <KanbanBoard
          tasks={tasks || []}
          currentWeekStart={currentWeekStart}
          weekOffset={weekOffset}
          onWeekOffsetChange={setWeekOffset}
          onTasksChange={() => mutate()}
        />
      </main>
    </div>
  )
}
