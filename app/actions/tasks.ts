"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface Task {
  id: number
  title: string
  description: string | null
  completed: boolean
  column_name: string | null
  position: number | null
  label: string | null
  clerk_user_id: string
  created_at: Date
  updated_at: Date
}

/**
 * Get all tasks for the current user
 */
export async function getTasks(): Promise<Task[]> {
  const userId = await requireAuth()

  const result = await sql`
    SELECT * FROM tasks 
    WHERE clerk_user_id = ${userId}
    ORDER BY position ASC, created_at DESC
  `

  return result as Task[]
}

/**
 * Create a new task for the current user
 */
export async function createTask(data: {
  title: string
  description?: string
  column_name?: string
  label?: string
}) {
  const userId = await requireAuth()

  const result = await sql`
    INSERT INTO tasks (
      title, 
      description, 
      column_name, 
      label,
      clerk_user_id,
      completed,
      created_at,
      updated_at
    )
    VALUES (
      ${data.title},
      ${data.description || null},
      ${data.column_name || null},
      ${data.label || null},
      ${userId},
      false,
      NOW(),
      NOW()
    )
    RETURNING *
  `

  revalidatePath("/")
  return result[0] as Task
}

/**
 * Update a task (only if it belongs to the current user)
 */
export async function updateTask(
  taskId: number,
  data: Partial<Pick<Task, "title" | "description" | "completed" | "column_name" | "label">>,
) {
  const userId = await requireAuth()

  const result = await sql`
    UPDATE tasks
    SET 
      title = COALESCE(${data.title}, title),
      description = COALESCE(${data.description}, description),
      completed = COALESCE(${data.completed}, completed),
      column_name = COALESCE(${data.column_name}, column_name),
      label = COALESCE(${data.label}, label),
      updated_at = NOW()
    WHERE id = ${taskId} AND clerk_user_id = ${userId}
    RETURNING *
  `

  if (result.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  revalidatePath("/")
  return result[0] as Task
}

/**
 * Delete a task (only if it belongs to the current user)
 */
export async function deleteTask(taskId: number) {
  const userId = await requireAuth()

  const result = await sql`
    DELETE FROM tasks
    WHERE id = ${taskId} AND clerk_user_id = ${userId}
    RETURNING id
  `

  if (result.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  revalidatePath("/")
  return { success: true }
}
