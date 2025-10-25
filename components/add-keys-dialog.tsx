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
import { KeyRound, Loader2, Sparkles, X, Pencil, Check } from "lucide-react"
import { generateSubtaskSuggestions, createSubtasks } from "@/app/actions/ai"
import type { Task } from "@/lib/db-types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Subtask {
  title: string
  description: string
}

interface AddKeysDialogProps {
  task: Task
  onTasksChange?: () => void
  onColumnChange?: (columnId: string) => void
}

export function AddKeysDialog({ task, onTasksChange, onColumnChange }: AddKeysDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingDescription, setEditingDescription] = useState("")
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [feedback, setFeedback] = useState("")

  const handleGenerateKeys = async (regenerationFeedback?: string) => {
    console.log("[v0] Starting key generation...")
    setLoading(true)
    setError(null)
    setShowFeedbackInput(false)

    try {
      const result = await generateSubtaskSuggestions(
        task.title,
        task.description,
        subtasks.length > 0 ? subtasks : undefined,
        regenerationFeedback,
      )
      console.log("[v0] Generation result:", result)

      if (result.success && result.subtasks) {
        console.log("[v0] Setting subtasks:", result.subtasks)
        setSubtasks(result.subtasks)
        setFeedback("")
      } else {
        console.error("[v0] Generation failed:", result.error)
        setError(result.error || "Failed to generate keys")
      }
    } catch (err) {
      console.error("[v0] Exception during generation:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
      console.log("[v0] Generation complete")
    }
  }

  const handleCreateKeys = async () => {
    console.log("[v0] Creating keys:", subtasks)
    setCreating(true)
    setError(null)

    try {
      const result = await createSubtasks(task.id, subtasks)
      console.log("[v0] Create result:", result)

      if (result.success) {
        console.log("[v0] Keys created successfully")
        onTasksChange?.()
        handleClose()
      } else {
        console.error("[v0] Create failed:", result.error)
        setError(result.error || "Failed to create keys")
      }
    } catch (err) {
      console.error("[v0] Exception during creation:", err)
      setError("An unexpected error occurred")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditingTitle(subtasks[index].title)
    setEditingDescription(subtasks[index].description)
  }

  const handleSaveEdit = (index: number) => {
    if (editingTitle.trim() && editingDescription.trim()) {
      const newSubtasks = [...subtasks]
      newSubtasks[index] = {
        title: editingTitle.trim(),
        description: editingDescription.trim(),
      }
      setSubtasks(newSubtasks)
    }
    setEditingIndex(null)
    setEditingTitle("")
    setEditingDescription("")
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingTitle("")
    setEditingDescription("")
  }

  const handleRegenerateClick = () => {
    if (subtasks.length > 0) {
      setShowFeedbackInput(true)
    } else {
      handleGenerateKeys()
    }
  }

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      handleGenerateKeys(feedback.trim())
    } else {
      handleGenerateKeys()
    }
  }

  const handleClose = () => {
    setOpen(false)
    setSubtasks([])
    setError(null)
    setEditingIndex(null)
    setEditingTitle("")
    setEditingDescription("")
    setShowFeedbackInput(false)
    setFeedback("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <KeyRound className="h-4 w-4" />
          Add Keys
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => {
          handleClose()
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Generate Keys for: {task.title}
          </DialogTitle>
          <DialogDescription>
            AI will generate 4 actionable subtasks to help you unlock this Door task. Edit them before creating.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {subtasks.length === 0 && !error && (
            <div className="text-center py-8">
              <Button onClick={() => handleGenerateKeys()} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Keys...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Keys with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
              {error}
              {error.includes("OPENAI_API_KEY") && (
                <p className="mt-2 text-xs">
                  Please add your OpenAI API key as an environment variable named OPENAI_API_KEY.
                </p>
              )}
            </div>
          )}

          {subtasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Generated Keys (edit before creating):</p>
              <div className="space-y-3">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium mt-1">
                      {index + 1}
                    </div>
                    {editingIndex === index ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Title"
                          className="h-8"
                          autoFocus
                        />
                        <Textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Description"
                          className="min-h-[60px] resize-none"
                        />
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => handleSaveEdit(index)}>
                            <Check className="h-3 w-3 text-green-600" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={handleCancelEdit}>
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{subtask.title}</p>
                          <p className="text-xs text-muted-foreground">{subtask.description}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleStartEdit(index)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDeleteSubtask(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showFeedbackInput && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium">What would you like to change?</p>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="E.g., 'Make them more specific' or 'Focus on technical implementation'"
                className="min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitFeedback} disabled={loading} className="gap-2 flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Regenerate with Feedback
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowFeedbackInput(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {subtasks.length > 0 && (
          <div className="flex gap-2 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleRegenerateClick}
              disabled={loading || creating || showFeedbackInput}
              className="gap-2 bg-transparent"
            >
              <Sparkles className="h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={handleCreateKeys} disabled={creating || showFeedbackInput} className="flex-1 gap-2">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Keys...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Create Keys
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
