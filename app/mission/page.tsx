"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/use-auth"
import { useRouter } from "next/navigation"
import { getTasks } from "../actions/tasks"
import { MissionBoard } from "@/components/mission-board"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, LogOut } from "lucide-react"
import useSWR from "swr"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { signOutUser } from "@/lib/auth-helpers"

export default function MissionPage() {
  const { data: session, status } = useAuth()

  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const {
    data: tasks,
    error,
    isLoading,
  } = useSWR(status === "authenticated" ? "mission-tasks" : null, () => getTasks(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  const handleSignOut = async () => {
    await signOutUser()
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mission Board</h1>
            <Link href="/">
              <Button variant="outline">Kanban Board</Button>
            </Link>
          </div>
        </header>
        <main>
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
          <h1 className="text-2xl font-bold">Mission Board</h1>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline">Kanban Board</Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main>
        <MissionBoard tasks={tasks || []} />
      </main>
    </div>
  )
}
