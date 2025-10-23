"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DaySelectorProps {
  selectedDay: string
  onDayChange: (day: string) => void
  onTaskDrop?: (taskId: number, day: string) => void
}

const days = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
]

export function DaySelector({ selectedDay, onDayChange, onTaskDrop }: DaySelectorProps) {
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent, dayId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverDay(dayId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverDay(null)
  }

  const handleDrop = (e: React.DragEvent, dayId: string) => {
    e.preventDefault()
    setDragOverDay(null)

    const taskId = e.dataTransfer.getData("taskId")
    if (taskId && onTaskDrop) {
      onTaskDrop(Number.parseInt(taskId), dayId)
    }
  }

  const handleDayClick = (dayId: string) => {
    onDayChange(dayId)
  }

  return (
    <div className="flex gap-2 justify-center">
      {days.map((day) => (
        <Button
          key={day.id}
          variant={selectedDay === day.id ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full font-semibold transition-all",
            selectedDay === day.id && "shadow-md scale-110",
            dragOverDay === day.id && "ring-2 ring-primary ring-offset-2 scale-110",
          )}
          onClick={() => handleDayClick(day.id)}
          onDragOver={(e) => handleDragOver(e, day.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, day.id)}
        >
          {day.label}
        </Button>
      ))}
    </div>
  )
}
