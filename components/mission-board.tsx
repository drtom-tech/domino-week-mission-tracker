"use client"

import type { Task } from "@/lib/db"
import { KanbanColumn } from "./kanban-column"
import { AddTaskDialog } from "./add-task-dialog"
import { MobileColumnSelector } from "./mobile-column-selector"
import { moveTask } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

interface MissionBoardProps {
  tasks: Task[]
  onTasksChange?: () => void // Added callback to revalidate tasks after changes
}

export function MissionBoard({ tasks, onTasksChange }: MissionBoardProps) {
  const [mobileColumn, setMobileColumn] = useState("mission_list")

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter((t) => t.column_name === columnId && !t.parent_id)
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
          onAddTask={onTasksChange} // Pass callback to trigger refetch
        />
      </div>
    )
  }

  return (
    <>
      {renderMobileView()}

      <div className="hidden md:grid md:grid-cols-4 gap-6 p-6">
        {/* Mission List */}
        <KanbanColumn
          title="Mission List"
          columnId="mission_list"
          tasks={getTasksByColumn("mission_list")}
          allTasks={tasks}
          onDrop={handleDrop}
          showAddButton
          onAddTask={onTasksChange} // Pass callback to trigger refetch
          className="md:col-span-1"
        />

        {/* Working On */}
        <KanbanColumn
          title="Working On"
          columnId="working_on"
          tasks={getTasksByColumn("working_on")}
          allTasks={tasks}
          onDrop={handleDrop}
          className="md:col-span-1"
        />

        {/* Yearly Targets */}
        <KanbanColumn
          title="Yearly Targets"
          columnId="yearly_targets"
          tasks={getTasksByColumn("yearly_targets")}
          allTasks={tasks}
          onDrop={handleDrop}
          className="md:col-span-1"
        />

        {/* Completed */}
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
          onSuccess={onTasksChange} // Trigger refetch after task creation
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
