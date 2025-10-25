"use client"

import type { Task } from "@/lib/db-types"
import { TaskCard } from "./task-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddTaskDialog } from "./add-task-dialog"
import { DaySelector } from "./day-selector"
import { useMemo } from "react"

interface KanbanColumnProps {
  title: string
  columnId: string
  tasks: Task[]
  subtaskMap: Map<number, Task[]>
  maxTasks?: number
  showAddButton?: boolean
  className?: string
  weekStartDate?: string
  showDaySelector?: boolean
  selectedDay?: string
  onDayChange?: (day: string) => void
  onTasksChange?: () => void
  onDayDrop?: (taskId: number, day: string) => void
  onColumnChange?: (columnId: string) => void
  isMobile?: boolean
  getHitListCount?: (day: string) => number
  getDoorCount?: () => number
  allTasks?: Task[] // Add allTasks prop to pass all tasks to TaskCard
}

export function KanbanColumn({
  title,
  columnId,
  tasks,
  subtaskMap,
  maxTasks,
  showAddButton = false,
  className,
  weekStartDate,
  showDaySelector = false,
  selectedDay,
  onDayChange,
  onTasksChange,
  onDayDrop,
  onColumnChange,
  isMobile = false,
  getHitListCount,
  getDoorCount,
  allTasks, // Receive allTasks prop
}: KanbanColumnProps) {
  const parentTasks = useMemo(() => {
    return tasks.filter((task) => !task.parent_id)
  }, [tasks])

  const isAtMaxCapacity = maxTasks !== undefined && parentTasks.length >= maxTasks

  const isHitListColumn = columnId.startsWith("hit_list_")
  const isFullyComplete = isHitListColumn && parentTasks.length >= 4 && parentTasks.every((task) => task.completed)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{title}</h2>
        {showAddButton && (
          <AddTaskDialog
            columnName={columnId}
            weekStartDate={weekStartDate}
            onSuccess={onTasksChange}
            trigger={
              <Button size="sm" variant="ghost" disabled={isAtMaxCapacity} className="h-7">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        )}
      </div>

      <Card
        className={cn(
          "p-4 min-h-[600px] transition-all duration-200",
          isFullyComplete && "bg-green-50 border-green-400",
        )}
      >
        {showDaySelector && selectedDay && onDayChange && (
          <div className="mb-4 pb-4 border-b">
            <DaySelector selectedDay={selectedDay} onDayChange={onDayChange} onTaskDrop={onDayDrop} />
          </div>
        )}

        <div className="space-y-3">
            {parentTasks.map((task, index) => {
              const subtasks = subtaskMap.get(task.id) || []

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  subtasks={subtasks}
                  showSubtasks={columnId === "the_door"}
                  weekStartDate={weekStartDate}
                  subtaskMap={subtaskMap}
                  onTasksChange={onTasksChange}
                  onDayChange={onDayChange}
                  onColumnChange={onColumnChange}
                  isMobile={isMobile}
                  isFirstInColumn={index === 0}
                  isLastInColumn={index === parentTasks.length - 1}
                  currentColumnId={columnId}
                  getHitListCount={getHitListCount}
                  getDoorCount={getDoorCount}
                  allTasks={allTasks}
                />
              )
            })}
            {parentTasks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No tasks</p>}
        </div>
      </Card>

      {maxTasks && (
        <p className="text-xs text-gray-500 text-center">
          {parentTasks.length} / {maxTasks} tasks
        </p>
      )}
    </div>
  )
}
