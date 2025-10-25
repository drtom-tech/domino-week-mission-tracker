"use server"

import { createClient } from "@/lib/supabase/server"
import type { Task } from "@/lib/db-types"

async function getUserId(): Promise<number> {
  const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true"
  const supabase = await createClient()

  if (DEV_MODE) {
    // In dev mode, use the dedicated test user email from environment variable
    const testUserEmail = process.env.DEV_TEST_USER_EMAIL || "test-user@example.com"

    const { data: testUser, error: testUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", testUserEmail)
      .single()

    if (testUserError || !testUser) {
      console.error(`[DEV MODE] Test user not found with email: ${testUserEmail}`)
      console.error("[DEV MODE] Please create a test user in Supabase with this email, or update DEV_TEST_USER_EMAIL in your .env.local")
      throw new Error(`Test user not found: ${testUserEmail}. Please create a dedicated test user in Supabase.`)
    }

    console.log(`[DEV MODE] Using test user ID: ${testUser.id} (${testUserEmail})`)
    return testUser.id
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: userData, error } = await supabase.from("users").select("id").eq("email", user.email).single()

  if (error || !userData) {
    throw new Error("User not found in database")
  }

  return userData.id
}

export async function getTasks(weekStartDate?: string) {
  console.log("[v0] getTasks called with weekStartDate:", weekStartDate)

  try {
    const supabase = await createClient()
    const userId = await getUserId()
    console.log("[v0] getTasks using userId:", userId)

    let query = supabase.from("tasks").select("*").eq("user_id", userId).order("position", { ascending: true })

    if (weekStartDate) {
      query = query.or(`week_start_date.eq.${weekStartDate},week_start_date.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] getTasks error:", error)
      return []
    }

    console.log("[v0] getTasks found", data?.length || 0, "tasks")
    return (data || []) as Task[]
  } catch (error) {
    console.error("[v0] getTasks error:", error)
    return []
  }
}

export async function createTask(data: {
  title: string
  description?: string
  label?: string
  columnName: string
  parentId?: number
  weekStartDate?: string
}) {
  console.log("[v0] createTask called with data:", data)

  const supabase = await createClient()
  const userId = await getUserId()
  console.log("[v0] createTask using userId:", userId)

  try {
    let maxPosQuery = supabase
      .from("tasks")
      .select("position")
      .eq("user_id", userId)
      .eq("column_name", data.columnName)
      .order("position", { ascending: false })
      .limit(1)

    if (data.weekStartDate) {
      maxPosQuery = maxPosQuery.eq("week_start_date", data.weekStartDate)
    }

    const { data: maxPosData } = await maxPosQuery
    const newPosition = (maxPosData?.[0]?.position ?? -1) + 1

    console.log("[v0] createTask newPosition:", newPosition)

    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        label: data.label || null,
        column_name: data.columnName,
        position: newPosition,
        parent_id: data.parentId || null,
        week_start_date: data.weekStartDate || null,
      })
      .select()
      .single()

    if (error) throw error

    console.log("[v0] createTask success, new task ID:", newTask?.id)
    return newTask
  } catch (error) {
    console.error("[v0] createTask error:", error)
    throw error
  }
}

export async function copyDoorTaskToHitList(
  taskId: number,
  newColumn: string,
  newPosition: number,
  weekStartDate: string,
) {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: originalTask } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (!originalTask) {
    throw new Error("Task not found or unauthorized")
  }

  const { data: existingCopy } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("linked_task_id", taskId)
    .eq("column_name", newColumn)
    .eq("week_start_date", weekStartDate)
    .single()

  if (existingCopy) {
    return
  }

  await supabase
    .from("tasks")
    .update({ position: supabase.rpc("increment_position") })
    .eq("user_id", userId)
    .eq("column_name", newColumn)
    .gte("position", newPosition)
    .eq("week_start_date", weekStartDate)

  const { data: newTask } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: originalTask.title,
      description: originalTask.description || null,
      label: "Hit",
      column_name: newColumn,
      position: newPosition,
      parent_id: null,
      week_start_date: weekStartDate,
      linked_task_id: taskId,
      completed: false,
    })
    .select()
    .single()

  await supabase.from("tasks").update({ linked_task_id: newTask.id }).eq("id", taskId).eq("user_id", userId)
}

export async function copyTaskFromHotList(
  taskId: number,
  targetColumn: string,
  newPosition: number,
  weekStartDate?: string,
) {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: originalTask } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (!originalTask) {
    throw new Error("Task not found or unauthorized")
  }

  const { data: existingCopy } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("linked_task_id", taskId)
    .eq("column_name", targetColumn)
    .eq("week_start_date", weekStartDate || null)
    .single()

  if (existingCopy) {
    return existingCopy.id
  }

  await supabase
    .from("tasks")
    .update({ position: supabase.rpc("increment_position") })
    .eq("user_id", userId)
    .eq("column_name", targetColumn)
    .gte("position", newPosition)
    .eq("week_start_date", weekStartDate || null)

  let newLabel = originalTask.label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const { data: newTask } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: originalTask.title,
      description: originalTask.description || null,
      label: newLabel,
      column_name: targetColumn,
      position: newPosition,
      parent_id: null,
      week_start_date: weekStartDate || null,
      linked_task_id: taskId,
      origin_column: "hot_list",
      completed: false,
    })
    .select()
    .single()

  await supabase.from("tasks").update({ linked_task_id: newTask.id }).eq("id", taskId).eq("user_id", userId)

  return newTask.id
}

export async function updateTask(id: number, data: Partial<Task>) {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).eq("user_id", userId).single()

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  const updates: any = { updated_at: new Date().toISOString() }

  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.label !== undefined) updates.label = data.label
  if (data.column_name !== undefined) updates.column_name = data.column_name
  if (data.position !== undefined) updates.position = data.position
  if (data.completed !== undefined) {
    updates.completed = data.completed
    updates.completed_at = data.completed ? new Date().toISOString() : null
  }

  const { error } = await supabase.from("tasks").update(updates).eq("id", id).eq("user_id", userId)

  if (error) throw error

  if (data.completed !== undefined && task.linked_task_id) {
    await supabase
      .from("tasks")
      .update({
        completed: data.completed,
        completed_at: data.completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.linked_task_id)
      .eq("user_id", userId)
  }
}

export async function deleteTask(id: number) {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: task } = await supabase.from("tasks").select("*").eq("id", id).eq("user_id", userId).single()

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId)

  if (error) throw error
}

export async function moveTask(taskId: number, newColumn: string, newPosition: number, weekStartDate?: string) {
  console.log("[v0] moveTask called:", { taskId, newColumn, newPosition, weekStartDate })

  const supabase = await createClient()
  const userId = await getUserId()

  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).eq("user_id", userId).single()

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  console.log("[v0] Task details:", {
    id: task.id,
    title: task.title,
    column_name: task.column_name,
    linked_task_id: task.linked_task_id,
  })

  let updateQuery = supabase
    .from("tasks")
    .update({ position: supabase.rpc("increment_position") })
    .eq("user_id", userId)
    .eq("column_name", newColumn)
    .gte("position", newPosition)

  if (weekStartDate) {
    updateQuery = updateQuery.eq("week_start_date", weekStartDate)
  } else {
    updateQuery = updateQuery.is("week_start_date", null)
  }

  await updateQuery

  let newLabel = task.label
  if (newColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  } else if (newColumn === "the_door") {
    newLabel = "Door"
  }

  const newCompleted = newColumn === "done" ? true : task.column_name === "done" ? false : task.completed
  const newCompletedAt =
    newColumn === "done" ? new Date().toISOString() : task.column_name === "done" ? null : task.completed_at

  await supabase
    .from("tasks")
    .update({
      column_name: newColumn,
      position: newPosition,
      week_start_date: weekStartDate || null,
      label: newLabel,
      completed: newCompleted,
      completed_at: newCompletedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId)
}

export async function reorderTask(taskId: number, direction: "up" | "down") {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).eq("user_id", userId).single()

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  const { data: columnTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("column_name", task.column_name)
    .eq("week_start_date", task.week_start_date || null)
    .order("position", { ascending: true })

  const currentIndex = columnTasks.findIndex((t: Task) => t.id === taskId)
  if (currentIndex === -1) return

  if (direction === "up" && currentIndex === 0) return
  if (direction === "down" && currentIndex === columnTasks.length - 1) return

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  const swapTask = columnTasks[swapIndex]

  await supabase
    .from("tasks")
    .update({ position: swapTask.position, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId)

  await supabase
    .from("tasks")
    .update({ position: task.position, updated_at: new Date().toISOString() })
    .eq("id", swapTask.id)
    .eq("user_id", userId)
}

export async function moveTaskBetweenDoorAndHitList(
  taskId: number,
  targetColumn: string,
  newPosition: number,
  weekStartDate?: string,
) {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).eq("user_id", userId).single()

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  await supabase
    .from("tasks")
    .update({ position: supabase.rpc("increment_position") })
    .eq("user_id", userId)
    .eq("column_name", targetColumn)
    .gte("position", newPosition)
    .eq("week_start_date", weekStartDate || null)

  let newLabel = task.label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const isMovingFromDoorToHitList = task.column_name === "the_door" && targetColumn.startsWith("hit_list_")

  await supabase
    .from("tasks")
    .update({
      column_name: targetColumn,
      position: newPosition,
      week_start_date: weekStartDate || null,
      label: newLabel,
      is_moved_to_hitlist: isMovingFromDoorToHitList ? true : task.is_moved_to_hitlist,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId)

  if (task.linked_task_id) {
    await supabase
      .from("tasks")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", task.linked_task_id)
      .eq("user_id", userId)
  }
}

export async function checkAndResetWeekly() {
  const supabase = await createClient()
  const userId = await getUserId()

  const { data: setting } = await supabase.from("settings").select("value").eq("key", "last_weekly_reset").single()

  if (!setting) return

  const lastReset = Number.parseInt(setting.value)
  const now = Date.now() / 1000
  const oneWeek = 7 * 24 * 60 * 60

  const currentDate = new Date()
  const dayOfWeek = currentDate.getDay()

  if (dayOfWeek === 1 && now - lastReset >= oneWeek) {
    await supabase
      .from("tasks")
      .update({
        column_name: "done",
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .like("column_name", "hit_list_%")

    await supabase
      .from("settings")
      .update({ value: now.toString(), updated_at: new Date().toISOString() })
      .eq("key", "last_weekly_reset")
  }
}
