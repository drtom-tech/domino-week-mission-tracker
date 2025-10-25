"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MoveRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MoveTaskDialogProps {
  taskId: number
  taskLabel: string | null
  currentColumn: string
  onMove: (taskId: number, newColumn: string) => Promise<void>
  weekStartDate: string
  onDayChange?: (day: string) => void
}

export function MoveTaskDialog({
  taskId,
  taskLabel,
  currentColumn,
  onMove,
  weekStartDate,
  onDayChange,
}: MoveTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const days = [
    { id: "mon", label: "M", full: "Monday" },
    { id: "tue", label: "T", full: "Tuesday" },
    { id: "wed", label: "W", full: "Wednesday" },
    { id: "thu", label: "T", full: "Thursday" },
    { id: "fri", label: "F", full: "Friday" },
  ]

  const columns = [
    { id: "hot_list", label: "Hot List", allowed: ["Door", "Hit", "To-Do", "Mission", null] },
    { id: "the_door", label: "The Door", allowed: ["Door"] },
    { id: "hit_list", label: "Hit List", allowed: ["Hit"], needsDay: true },
    { id: "done", label: "Done", allowed: ["Door", "Hit", "To-Do", "Mission", null] },
  ]

  const isColumnAllowed = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId)
    if (!column) return false
    return column.allowed.includes(taskLabel)
  }

  const handleMove = async (columnId: string) => {
    if (columnId === "hit_list") {
      if (!selectedDay) {
        alert("Please select a day for the Hit List")
        return
      }
      onDayChange?.(selectedDay)
      await onMove(taskId, `hit_list_${selectedDay}`)
    } else {
      await onMove(taskId, columnId)
    }
    setOpen(false)
    setSelectedDay(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
          <MoveRight className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Task</DialogTitle>
          <DialogDescription>Select a column to move this task to</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {columns.map((column) => {
            const allowed = isColumnAllowed(column.id)
            const isCurrent = currentColumn === column.id || currentColumn.startsWith(column.id)

            return (
              <div key={column.id}>
                <Button
                  variant={isCurrent ? "secondary" : "outline"}
                  className={cn("w-full justify-start", !allowed && "opacity-50 cursor-not-allowed")}
                  disabled={!allowed || isCurrent}
                  onClick={() => {
                    if (column.needsDay) {
                      // Don't move yet, wait for day selection
                    } else {
                      handleMove(column.id)
                    }
                  }}
                >
                  {column.label}
                  {isCurrent && <span className="ml-2 text-xs">(current)</span>}
                </Button>

                {column.id === "hit_list" && allowed && (
                  <div className="mt-2 ml-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Select a day:</p>
                    <div className="flex gap-2">
                      {days.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => {
                            setSelectedDay(day.id)
                            handleMove("hit_list")
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all",
                            selectedDay === day.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-gray-300 hover:border-primary hover:bg-gray-50",
                          )}
                          title={day.full}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
