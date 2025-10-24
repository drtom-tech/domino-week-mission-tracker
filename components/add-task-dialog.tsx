"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTask } from "@/app/actions/tasks"
import type { TaskLabel } from "@/lib/db"

interface AddTaskDialogProps {
  columnName: string
  trigger?: React.ReactNode
  showLabelSelector?: boolean
  parentId?: number
  weekStartDate?: string
  onSuccess?: () => void
}

export function AddTaskDialog({
  columnName,
  trigger,
  showLabelSelector = false,
  parentId,
  weekStartDate,
  onSuccess,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [label, setLabel] = useState<TaskLabel | "">("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    console.log("[v0] AddTaskDialog: Creating task", { title, columnName, parentId, weekStartDate })

    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      label: label || undefined,
      columnName,
      parentId,
      weekStartDate: columnName.startsWith("hit_list_") ? weekStartDate : undefined,
    })

    console.log("[v0] AddTaskDialog: Task created, calling onSuccess")

    setTitle("")
    setDescription("")
    setLabel("")
    setOpen(false)

    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button>Add Task</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {showLabelSelector && (
            <div>
              <Label htmlFor="label">Label</Label>
              <Select value={label} onValueChange={(value) => setLabel(value as TaskLabel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Door">Door</SelectItem>
                  <SelectItem value="Hit">Hit</SelectItem>
                  <SelectItem value="To-Do">To-Do</SelectItem>
                  <SelectItem value="Mission">Mission</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
