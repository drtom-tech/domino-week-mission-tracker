"use client"

import type { Task } from "@/lib/db"
import { KanbanColumn } from "./kanban-column"
import { AddTaskDialog } from "./add-task-dialog"
import { MobileColumnSelector } from "./mobile-column-selector"
import { QuarterNavigator } from "./quarter-navigator"
import { moveTask } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"
import { formatQuarterLabel, isDateInQuarter } from "@/lib/utils"

interface MissionBoardProps {
  tasks: Task[]
  currentQuarterStart: string
  quarterOffset: number
  onQuarterOffsetChange: (offset: number) => void
  onTasksChange?: () => void
  portalContainer: HTMLElement | null
}

export function MissionBoard({
  tasks,
  currentQuarterStart,
  quarterOffset,
  onQuarterOffsetChange,
  onTasksChange,
  portalContainer,
}: MissionBoardProps) {
  const [mobileColumn, setMobileColumn] = useState("mission_list")

  const getTasksByColumn = (columnId: string) => {
    const baseTasks = tasks.filter((t) => t.column_name === columnId && !t.parent_id)

    // Only filter "working_on" by quarter
    if (columnId === "working_on" && currentQuarterStart) {
      return baseTasks.filter((t) => {
        // If task has a week_start_date, check if it's in the current quarter
        if (t.week_start_date) {
          return isDateInQuarter(t.week_start_date, currentQuarterStart)
        }
        // If no week_start_date, include it (for backwards compatibility)
        return true
      })
    }

    // Mission List, Yearly Targets, and Completed are not filtered by quarter
    return baseTasks
  }

  const handleDrop = async (taskId: number, newColumn: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Mission tasks can only move within Mission board
    const missionColumns = ["mission_list", "working_on", "completed", "yearly_targets"]
    if (!missionColumns.includes(newColumn)) {
      alert("Mission tasks can only move within the Mission board")
      return
    }

    await moveTask(taskId, newColumn, 0)
    if (onTasksChange) {
      onTasksChange()
    }
  }

  const mobileColumns = [
    { id: "mission_list", label: "Mission List" },
    { id: "working_on", label: "Working On" },
    { id: "yearly_targets", label: "Yearly Targets" },
    { id: "completed", label: "Completed" },
  ]

  const quarterLabel = currentQuarterStart ? formatQuarterLabel(new Date(currentQuarterStart)) : ""

  const handleCurrentQuarter = () => {
    onQuarterOffsetChange(0)
  }

  const renderMobileView = () => {
    const selectedCol = mobileColumns.find((col) => col.id === mobileColumn)
    if (!selectedCol) return null

    return (
      <div className="md:hidden p-4">
        <MobileColumnSelector columns={mobileColumns} selectedColumn={mobileColumn} onColumnChange={setMobileColumn} />
        <KanbanColumn
          title={selectedCol.label}
          columnId={selectedCol.id}
          tasks={getTasksByColumn(selectedCol.id)}
          allTasks={tasks}
          onDrop={handleDrop}
          showAddButton={selectedCol.id === "mission_list"}
          onAddTask={onTasksChange}
        />
      </div>
    )
  }

  return (
    <>
      {portalContainer &&
        createPortal(
          <QuarterNavigator
            quarterLabel={quarterLabel}
            onPreviousQuarter={() => onQuarterOffsetChange(quarterOffset - 1)}
            onNextQuarter={() => onQuarterOffsetChange(quarterOffset + 1)}
            onCurrentQuarter={handleCurrentQuarter}
          />,
          portalContainer,
        )}

      {renderMobileView()}

      <div className="hidden md:grid md:grid-cols-4 gap-6 p-6">
        {/* Mission List - not filtered by quarter */}
        <KanbanColumn
          title="Mission List"
          columnId="mission_list"
          tasks={getTasksByColumn("mission_list")}
          allTasks={tasks}
          onDrop={handleDrop}
          showAddButton
          onAddTask={onTasksChange}
          className="md:col-span-1"
        />

        {/* Working On - filtered by selected quarter */}
        <KanbanColumn
          title="Working On"
          columnId="working_on"
          tasks={getTasksByColumn("working_on")}
          allTasks={tasks}
          onDrop={handleDrop}
          className="md:col-span-1"
        />

        {/* Yearly Targets - not filtered by quarter */}
        <KanbanColumn
          title="Yearly Targets"
          columnId="yearly_targets"
          tasks={getTasksByColumn("yearly_targets")}
          allTasks={tasks}
          onDrop={handleDrop}
          className="md:col-span-1"
        />

        {/* Completed - not filtered by quarter */}
        <KanbanColumn
          title="Completed"
          columnId="completed"
          tasks={getTasksByColumn("completed")}
          allTasks={tasks}
          onDrop={handleDrop}
          className="md:col-span-1"
        />
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <AddTaskDialog
          columnName="mission_list"
          onSuccess={onTasksChange}
          trigger={
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          }
        />
      </div>
    </>
  )
}
