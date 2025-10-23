"use client"

import { getTasks } from "../actions/tasks"
import { MissionBoard } from "@/components/mission-board"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import useSWR from "swr"
import { KanbanSkeleton } from "@/components/kanban-skeleton"
import { useState, useEffect, useMemo } from "react"
import { getCurrentQuarter, formatQuarter, addQuarters } from "@/lib/utils"

export default function MissionPage() {
  const [quarterOffset, setQuarterOffset] = useState(0)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  const currentQuarter = useMemo(() => {
    const { year, quarter } = getCurrentQuarter()
    return addQuarters(year, quarter, quarterOffset)
  }, [quarterOffset])

  const quarterLabel = formatQuarter(currentQuarter.year, currentQuarter.quarter)

  useEffect(() => {
    setPortalContainer(document.getElementById("quarter-nav-container"))
  }, [])

  const {
    data: tasks,
    error,
    isLoading,
  } = useSWR("mission-tasks", () => getTasks(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  if (isLoading) {
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
          <div className="flex-1 flex justify-center">
            <div id="quarter-nav-container"></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Kanban Board</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>
        <MissionBoard
          tasks={tasks || []}
          currentQuarter={currentQuarter}
          quarterLabel={quarterLabel}
          quarterOffset={quarterOffset}
          onQuarterOffsetChange={setQuarterOffset}
          portalContainer={portalContainer}
        />
      </main>
    </div>
  )
}
