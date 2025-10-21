"use client"
import { useState, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, MoveRight, Pencil, FileText, Loader2 } from "lucide-react"
import { updateTask, reorderTask } from "@/app/actions/tasks"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddKeysDialog } from "./add-keys-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import { moveTask } from "@/app/actions/tasks"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import React from "react"
import type { Task } from "@/types/task" // Declare the Task variable

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  showSubtasks?: boolean
  subtasks?: Task[]
  weekStartDate?: string
  subtaskMap?: Map<number, Task[]>
  onTasksChange?: () => void
  onDayChange?: (day: string) => void
  onColumnChange?: (columnId: string) => void
  isMobile?: boolean
  isFirstInColumn?: boolean
  isLastInColumn?: boolean
  currentColumnId?: string
  getHitListCount?: (day: string) => number // Add getHitListCount prop
  getDoorCount?: () => number // Add getDoorCount prop
  allTasks?: Task[] // Add allTasks prop to access all tasks for finding linked tasks
}

export const TaskCard = React.memo(function TaskCard({
  task,
  isDragging: externalIsDragging,
  showSubtasks = false,
  subtasks = [],
  weekStartDate = "",
  subtaskMap,
  onTasksChange,
  onDayChange,
  onColumnChange,
  isMobile = false,
  isFirstInColumn = false,
  isLastInColumn = false,
  currentColumnId,
  getHitListCount,
  getDoorCount,
  allTasks, // Receive allTasks prop
}: TaskCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [movingToColumn, setMovingToColumn] = useState<string | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      task,
      columnId: currentColumnId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || externalIsDragging ? 0.5 : 1,
  }

  const tasksForSearch = useMemo(() => {
    if (allTasks) return allTasks
    // Fallback: create local task list from current task and subtasks
    if (!subtaskMap) return [task]
    const tasks: Task[] = [task]
    const taskSubtasks = subtaskMap.get(task.id)
    if (taskSubtasks) {
      tasks.push(...taskSubtasks)
    }
    return tasks
  }, [allTasks, subtaskMap, task])

  const linkedTask = useMemo(
    () => (task.linked_task_id ? tasksForSearch.find((t) => t.id === task.linked_task_id) : null),
    [task.linked_task_id, tasksForSearch],
  )

  const isDoorTaskInHitList = useMemo(() => {
    if (!task.column_name.startsWith("hit_list_")) return false
    if (!task.linked_task_id) return false
    return linkedTask?.column_name === "the_door"
  }, [task.column_name, task.linked_task_id, linkedTask])

  const hasCopyInDoorOrHitList = useMemo(() => {
    if (task.column_name !== "hot_list") return false
    if (!linkedTask) return false
    return linkedTask.column_name === "the_door" || linkedTask.column_name.startsWith("hit_list_")
  }, [task.column_name, linkedTask])

  const isInDoorWithCopy =
    task.column_name === "the_door" && linkedTask && linkedTask.column_name.startsWith("hit_list_")

  const getHitListDayLabel = (columnName: string) => {
    const dayMap: { [key: string]: string } = {
      hit_list_mon: "Mon",
      hit_list_tue: "Tue",
      hit_list_wed: "Wed",
      hit_list_thu: "Thu",
      hit_list_fri: "Fri",
    }
    return dayMap[columnName] || ""
  }

  const handleToggleComplete = useCallback(async () => {
    await updateTask(task.id, { completed: !task.completed })
    onTasksChange?.()
  }, [task.id, task.completed, onTasksChange])

  const handleMoveUp = useCallback(async () => {
    await reorderTask(task.id, "up")
    onTasksChange?.()
  }, [task.id, onTasksChange])

  const handleMoveDown = useCallback(async () => {
    await reorderTask(task.id, "down")
    onTasksChange?.()
  }, [task.id, onTasksChange])

  const handleMoveToColumn = useCallback(
    async (newColumn: string) => {
      setMovingToColumn(newColumn)

      const columnToReturnTo = currentColumnId

      if (isMobile && onColumnChange && columnToReturnTo) {
        onColumnChange(columnToReturnTo)
      }

      if (newColumn === "hit_list" && task.completed) {
        await updateTask(task.id, { completed: false })
      } else if (newColumn === "done") {
        await updateTask(task.id, { completed: true })
      } else {
        await moveTask(
          task.id,
          newColumn,
          0,
          newColumn.startsWith("hit_list_") || newColumn === "the_door" ? weekStartDate : undefined,
        )
      }

      setShowMoveDialog(false)
      setMovingToColumn(null)
      onTasksChange?.()
    },
    [task.id, task.completed, currentColumnId, isMobile, onColumnChange, weekStartDate, onTasksChange],
  )

  const handleToggleSubtasks = () => {
    // Implement toggle subtasks logic here
  }

  const getLabelColor = (label: string | null) => {
    switch (label) {
      case "Door":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "Hit":
        return "bg-teal-100 text-teal-800 border-teal-300"
      case "To-Do":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Mission":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const doorHasItem = useMemo(() => {
    if (!getDoorCount) return false
    const count = getDoorCount()
    // If this task is already in the door, don't count it against capacity
    if (task.column_name === "the_door" && !task.parent_id) {
      return count > 1 // More than just this task
    }
    return count >= 1 // Door is at capacity
  }, [getDoorCount, task.column_name, task.parent_id])

  const days = [
    { id: "mon", label: "Monday" },
    { id: "tue", label: "Tuesday" },
    { id: "wed", label: "Wednesday" },
    { id: "thu", label: "Thursday" },
    { id: "fri", label: "Friday" },
  ]

  const availableColumns = useMemo(() => {
    if (task.completed && task.column_name.startsWith("hit_list_")) {
      return [{ id: "hit_list", label: "Hit List", disabled: false }]
    }

    const columns: Array<{ id: string; label: string; disabled: boolean; reason?: string }> = []

    const isAISubtask = !!task.parent_id

    if (task.column_name === "hot_list") {
      columns.push({
        id: "the_door",
        label: "The Door",
        disabled: doorHasItem,
        reason: doorHasItem ? "Already has an item this week" : undefined,
      })

      days.forEach((day) => {
        const count = getHitListCount ? getHitListCount(day.id) : 0
        const isAtCapacity = count >= 4
        columns.push({
          id: `hit_list_${day.id}`,
          label: `Hit List - ${day.label} (${count}/4)`,
          disabled: isAtCapacity,
          reason: isAtCapacity ? "Already has 4 items" : undefined,
        })
      })

      return columns
    }

    if (isAISubtask && task.label === "Door") {
      columns.push({
        id: "the_door",
        label: "The Door",
        disabled: false,
      })

      days.forEach((day) => {
        const count = getHitListCount ? getHitListCount(day.id) : 0
        const isCurrentColumn = task.column_name === `hit_list_${day.id}`
        const isAtCapacity = isCurrentColumn ? count > 4 : count >= 4
        columns.push({
          id: `hit_list_${day.id}`,
          label: `Hit List - ${day.label} (${count}/4)`,
          disabled: isAtCapacity,
          reason: isAtCapacity ? "Already has 4 items" : undefined,
        })
      })

      const isInHitList = task.column_name.startsWith("hit_list_")

      if (isInHitList) {
        columns.push({
          id: "done",
          label: "Done",
          disabled: false,
        })
      }

      return columns.filter((col) => col.id !== task.column_name)
    }

    if (task.column_name.startsWith("hit_list_")) {
      const cameFromHotList = task.origin_column === "hot_list" || (linkedTask && linkedTask.column_name === "hot_list")

      if (cameFromHotList) {
        columns.push({ id: "hot_list", label: "Hot List", disabled: false })
      }

      const cameFromDoor = task.origin_column === "the_door" || (linkedTask && linkedTask.column_name === "the_door")

      if (cameFromDoor) {
        columns.push({
          id: "the_door",
          label: "The Door",
          disabled: false, // Always enabled for tasks that came from Door
        })
      }

      days.forEach((day) => {
        const count = getHitListCount ? getHitListCount(day.id) : 0
        const isCurrentColumn = task.column_name === `hit_list_${day.id}`
        const isAtCapacity = isCurrentColumn ? count > 4 : count >= 4
        columns.push({
          id: `hit_list_${day.id}`,
          label: `Hit List - ${day.label} (${count}/4)`,
          disabled: isAtCapacity,
          reason: isAtCapacity ? "Already has 4 items" : undefined,
        })
      })

      columns.push({ id: "done", label: "Done", disabled: false })

      return columns.filter((col) => col.id !== task.column_name)
    }

    if (task.label === "Door" && !isAISubtask) {
      columns.push({ id: "hot_list", label: "Hot List", disabled: false })

      // Add Hit List days as options
      days.forEach((day) => {
        const count = getHitListCount ? getHitListCount(day.id) : 0
        const isAtCapacity = count >= 4
        columns.push({
          id: `hit_list_${day.id}`,
          label: `Hit List - ${day.label} (${count}/4)`,
          disabled: isAtCapacity,
          reason: isAtCapacity ? "Already has 4 items" : undefined,
        })
      })

      // Door parent tasks CANNOT move directly to Done
      // They must go through Hit List first (via their subtasks)
      return columns.filter((col) => col.id !== task.column_name)
    } else if (task.label === "Hit") {
      columns.push({ id: "hot_list", label: "Hot List", disabled: false })
      days.forEach((day) => {
        const count = getHitListCount ? getHitListCount(day.id) : 0
        const isCurrentColumn = task.column_name === `hit_list_${day.id}`
        const isAtCapacity = isCurrentColumn ? count > 4 : count >= 4
        columns.push({
          id: `hit_list_${day.id}`,
          label: `Hit List - ${day.label} (${count}/4)`,
          disabled: isAtCapacity,
          reason: isAtCapacity ? "Already has 4 items" : undefined,
        })
      })
    } else {
      if (!isAISubtask) {
        columns.push({ id: "hot_list", label: "Hot List", disabled: false })
      }
    }

    return columns.filter((col) => col.id !== task.column_name)
  }, [
    task.column_name,
    task.origin_column,
    task.parent_id,
    task.label,
    task.completed,
    doorHasItem,
    getHitListCount,
    linkedTask,
  ])

  const openEditDialog = useCallback(() => {
    setShowEditDialog(true)
  }, [])

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "p-3 transition-all cursor-grab active:cursor-grabbing",
          task.completed &&
            currentColumnId !== "done" &&
            task.column_name === "the_door" &&
            "border-green-300 bg-green-50/30",
          task.completed &&
            currentColumnId !== "done" &&
            task.column_name !== "the_door" &&
            "opacity-60 bg-gray-100/50 border-gray-300",
          hasCopyInDoorOrHitList && "opacity-50 bg-gray-100/50 border-gray-300",
          isInDoorWithCopy && !task.completed && "border-orange-300 bg-orange-50/30",
          isDragging && "opacity-50 rotate-2 scale-105",
        )}
      >
        <div className="flex items-start gap-2">
          {currentColumnId !== "done" && (
            <div className="flex flex-col gap-1 -my-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={handleMoveUp}
                disabled={isFirstInColumn}
              >
                <ChevronUp className={cn("w-5 h-5", isFirstInColumn ? "text-gray-300" : "text-gray-600")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={handleMoveDown}
                disabled={isLastInColumn}
              >
                <ChevronDown className={cn("w-5 h-5", isLastInColumn ? "text-gray-300" : "text-gray-600")} />
              </Button>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3
                className={cn(
                  "font-medium text-sm leading-snug",
                  task.completed && currentColumnId !== "done" && "line-through text-gray-400",
                )}
              >
                {task.title}
              </h3>
              <div className="flex gap-1 flex-shrink-0">
                {task.subtasks && task.subtasks.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={handleToggleSubtasks}>
                    {/* Implement icon for toggle subtasks */}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {isDoorTaskInHitList ? (
                <>
                  <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full border", getLabelColor("Hit"))}>
                    Hit
                  </span>
                  <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full border", getLabelColor("Door"))}>
                    Door
                  </span>
                </>
              ) : (
                task.label && (
                  <span
                    className={cn("inline-block text-xs px-2 py-0.5 rounded-full border", getLabelColor(task.label))}
                  >
                    {task.label}
                  </span>
                )
              )}

              {isInDoorWithCopy && linkedTask && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full border bg-teal-100 text-teal-800 border-teal-300">
                  → {getHitListDayLabel(linkedTask.column_name)}
                </span>
              )}
            </div>

            {task.column_name === "the_door" && !task.parent_id && (
              <div className="mt-3">
                <AddKeysDialog task={task} onTasksChange={onTasksChange} onColumnChange={onColumnChange} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 -my-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => setShowMoveDialog(true)}>
              <MoveRight className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={openEditDialog}>
              <Pencil className="w-4 h-4 text-gray-600" />
            </Button>
            {task.description && (
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={openEditDialog}>
                <FileText className="h-4 w-4 text-gray-500" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {showSubtasks &&
        subtasks.map((subtask) => (
          <TaskCard
            key={subtask.id}
            task={subtask}
            subtasks={[]}
            showSubtasks={false}
            weekStartDate={weekStartDate}
            subtaskMap={subtaskMap}
            onTasksChange={onTasksChange}
            onDayChange={onDayChange}
            onColumnChange={onColumnChange}
            isMobile={isMobile}
            isFirstInColumn={false}
            isLastInColumn={false}
            currentColumnId={currentColumnId}
            getHitListCount={getHitListCount}
            getDoorCount={getDoorCount}
            allTasks={allTasks} // Pass allTasks prop to subtasks
          />
        ))}

      <EditTaskDialog
        task={task}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onTasksChange}
        onColumnChange={onColumnChange}
      />

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => {
            setShowMoveDialog(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>Move to Column</DialogTitle>
            <DialogDescription>Select a column to move "{task.title}" to</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {availableColumns.map((column) => (
              <Button
                key={column.id}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left h-auto py-3",
                  column.disabled && "opacity-50 cursor-not-allowed",
                  movingToColumn === column.id && "bg-primary/10 border-primary",
                )}
                onClick={() => !column.disabled && handleMoveToColumn(column.id)}
                disabled={column.disabled || movingToColumn !== null}
              >
                <div className="flex items-center gap-2 w-full">
                  {movingToColumn === column.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{column.label}</span>
                    {column.reason && <span className="text-xs text-muted-foreground mt-1">{column.reason}</span>}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
