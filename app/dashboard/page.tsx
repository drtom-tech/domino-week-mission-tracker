"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { getTasks, createTask, updateTask, deleteTask, type Task } from "@/app/actions/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

const COLUMNS = ["To Do", "In Progress", "Done"]

export default function DashboardPage() {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [selectedColumn, setSelectedColumn] = useState<string>("To Do")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (error) {
      toast.error("Failed to load tasks")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTask() {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title")
      return
    }

    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDescription,
        column_name: selectedColumn,
      })
      toast.success("Task created successfully")
      setNewTaskTitle("")
      setNewTaskDescription("")
      setIsDialogOpen(false)
      loadTasks()
    } catch (error) {
      toast.error("Failed to create task")
      console.error(error)
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      await deleteTask(taskId)
      toast.success("Task deleted successfully")
      loadTasks()
    } catch (error) {
      toast.error("Failed to delete task")
      console.error(error)
    }
  }

  async function handleMoveTask(taskId: number, newColumn: string) {
    try {
      await updateTask(taskId, { column_name: newColumn })
      loadTasks()
    } catch (error) {
      toast.error("Failed to move task")
      console.error(error)
    }
  }

  function getTasksByColumn(column: string) {
    return tasks.filter((task) => task.column_name === column)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mission and Door</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName || "User"}!</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Column</label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {COLUMNS.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreateTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((column) => (
          <div key={column} className="flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{column}</span>
                  <span className="text-sm font-normal text-muted-foreground">{getTasksByColumn(column).length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getTasksByColumn(column).map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
                    <div className="flex gap-2">
                      {COLUMNS.filter((col) => col !== column).map((col) => (
                        <Button
                          key={col}
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveTask(task.id, col)}
                          className="text-xs"
                        >
                          Move to {col}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ))}
                {getTasksByColumn(column).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No tasks in this column</div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
