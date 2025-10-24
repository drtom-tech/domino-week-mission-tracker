"use server"

import { createClient } from "@/lib/supabase/server"
import type { Task } from "@/lib/db"
import { getUserId } from "@/lib/get-user-id"

export async function getTasks(weekStartDate?: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    let query = supabase.from("tasks").select("*").eq("user_id", userId).order("position", { ascending: true })

    if (weekStartDate) {
      query = query.or(`week_start_date.eq.${weekStartDate},week_start_date.is.null`)
    }

    const { data, error } = await query

    if (error) throw error
    return (data as Task[]) || []
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
  const userId = await getUserId()
  const supabase = await createClient()

  // Get max position
  let query = supabase
    .from("tasks")
    .select("position")
    .eq("user_id", userId)
    .eq("column_name", data.columnName)
    .order("position", { ascending: false })
    .limit(1)

  if (data.weekStartDate) {
    query = query.eq("week_start_date", data.weekStartDate)
  }

  const { data: maxData } = await query
  const newPosition = (maxData?.[0]?.position ?? -1) + 1

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: data.title,
    description: data.description || null,
    label: data.label || null,
    column_name: data.columnName,
    position: newPosition,
    parent_id: data.parentId || null,
    week_start_date: data.weekStartDate || null,
  })

  if (error) throw error
}

export async function copyDoorTaskToHitList(
  taskId: number,
  newColumn: string,
  newPosition: number,
  weekStartDate: string,
) {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data: originalTask, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !originalTask) {
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

  if (existingCopy) return

  // Update positions
  await supabase
    .from("tasks")
    .update({ position: supabase.sql`position + 1` })
    .eq("user_id", userId)
    .eq("column_name", newColumn)
    .gte("position", newPosition)
    .eq("week_start_date", weekStartDate)

  // Insert new task
  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: originalTask.title,
      description: originalTask.description,
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

  if (insertError) throw insertError

  // Update original task
  await supabase.from("tasks").update({ linked_task_id: newTask.id }).eq("id", taskId).eq("user_id", userId)
}

export async function copyTaskFromHotList(
  taskId: number,
  targetColumn: string,
  newPosition: number,
  weekStartDate?: string,
) {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data: originalTask, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !originalTask) {
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

  // Update positions
  let updateQuery = supabase
    .from("tasks")
    .update({ position: supabase.sql`position + 1` })
    .eq("user_id", userId)
    .eq("column_name", targetColumn)
    .gte("position", newPosition)

  if (weekStartDate) {
    updateQuery = updateQuery.eq("week_start_date", weekStartDate)
  } else {
    updateQuery = updateQuery.is("week_start_date", null)
  }

  await updateQuery

  let newLabel = originalTask.label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const { data: newTaskData, error: insertError } = await supabase.from("tasks").insert({
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

  if (insertError) throw insertError

  const newTask = newTaskData?.[0]

  // Update original task
  await supabase.from("tasks").update({ linked_task_id: newTask?.id }).eq("id", taskId).eq("user_id", userId)

  return newTask?.id
}

export async function updateTask(id: number, data: Partial<Task>) {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (fetchError || !task) {
    throw new Error("Task not found or unauthorized")
  }

  const updates: any = {}

  if (data.title !== undefined) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.label !== undefined) updates.label = data.label
  if (data.column_name !== undefined) updates.column_name = data.column_name
  if (data.position !== undefined) updates.position = data.position
  if (data.completed !== undefined) {
    updates.completed = data.completed
    updates.completed_at = data.completed ? new Date().toISOString() : null
  }

  updates.updated_at = new Date().toISOString()

  const { error: updateError } = await supabase.from("tasks").update(updates).eq("id", id).eq("user_id", userId)

  if (updateError) throw updateError

  // Update linked task if completed status changed
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
  const userId = await getUserId()
  const supabase = await createClient()

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId)

  if (error) throw error
}

export async function reorderTask(taskId: number, direction: "up" | "down") {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !task) {
    throw new Error("Task not found or unauthorized")
  }

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("column_name", task.column_name)
    .order("position", { ascending: true })

  if (task.week_start_date) {
    query = query.eq("week_start_date", task.week_start_date)
  } else {
    query = query.is("week_start_date", null)
  }

  const { data: columnTasks } = await query

  if (!columnTasks) return

  const currentIndex = columnTasks.findIndex((t: Task) => t.id === taskId)
  if (currentIndex === -1) return

  if (direction === "up" && currentIndex === 0) return
  if (direction === "down" && currentIndex === columnTasks.length - 1) return

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  const swapTask = columnTasks[swapIndex]

  await supabase.from("tasks").update({ position: swapTask.position }).eq("id", taskId).eq("user_id", userId)

  await supabase.from("tasks").update({ position: task.position }).eq("id", swapTask.id).eq("user_id", userId)
}

export async function moveTaskToColumn(
  taskId: number,
  direction: "left" | "right",
  currentColumn: string,
  weekStartDate?: string,
) {
  const columns = ["hot_list", "the_door", "hit_list", "done"]

  let currentIndex = columns.indexOf(currentColumn)
  if (currentColumn.startsWith("hit_list_")) {
    currentIndex = 2
  }

  if (currentIndex === -1) return

  const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1
  if (newIndex < 0 || newIndex >= columns.length) return

  let newColumn = columns[newIndex]

  if (newColumn === "hit_list" && weekStartDate) {
    if (currentColumn.startsWith("hit_list_")) {
      const day = currentColumn.split("_")[2]
      newColumn = `hit_list_${day}`
    } else {
      newColumn = "hit_list_mon"
    }
  }

  await moveTask(taskId, newColumn, 0, weekStartDate)
}

export async function moveTask(taskId: number, newColumn: string, newPosition: number, weekStartDate?: string) {
  console.log("[v0] moveTask called:", { taskId, newColumn, newPosition, weekStartDate })

  const userId = await getUserId()
  const supabase = await createClient()

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !task) {
    throw new Error("Task not found or unauthorized")
  }

  console.log("[v0] Task details:", {
    id: task.id,
    title: task.title,
    column_name: task.column_name,
    linked_task_id: task.linked_task_id,
    parent_id: task.parent_id,
    label: task.label,
  })

  const isHitListCopyMovingToDoor =
    task.column_name.startsWith("hit_list_") && newColumn === "the_door" && task.linked_task_id

  console.log("[v0] isHitListCopyMovingToDoor:", isHitListCopyMovingToDoor)

  if (isHitListCopyMovingToDoor) {
    console.log("[v0] Hit List copy being moved back to Door - initiating merge")

    const { data: doorOriginal } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task.linked_task_id)
      .eq("user_id", userId)
      .single()

    if (!doorOriginal) {
      console.log("[v0] ERROR: Door original not found for linked_task_id:", task.linked_task_id)
      throw new Error("Linked task not found or unauthorized")
    }

    console.log("[v0] Door original found:", {
      id: doorOriginal.id,
      title: doorOriginal.title,
      parent_id: doorOriginal.parent_id,
      column_name: doorOriginal.column_name,
      label: doorOriginal.label,
    })

    const isDoorSubtask =
      doorOriginal.parent_id && doorOriginal.column_name === "the_door" && doorOriginal.label === "Door"

    if (isDoorSubtask) {
      console.log("[v0] Merging: Restoring Door subtask, deleting Hit List copy")

      await supabase
        .from("tasks")
        .update({ linked_task_id: null, updated_at: new Date().toISOString() })
        .eq("id", task.linked_task_id)
        .eq("user_id", userId)

      await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId)

      console.log("[v0] Merge complete: Door subtask restored to normal, Hit List copy deleted")
      return
    } else {
      console.log("[v0] Door original is a main task (not subtask) - restoring it")

      await supabase
        .from("tasks")
        .update({ linked_task_id: null, updated_at: new Date().toISOString() })
        .eq("id", task.linked_task_id)
        .eq("user_id", userId)

      await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId)

      console.log("[v0] Hit List copy deleted, Door main task restored")
      return
    }
  }

  const isDoorSubtask = task.label === "Door" && task.parent_id && task.column_name === "the_door"
  const isMovingToHitList = newColumn.startsWith("hit_list_")

  if (isDoorSubtask && isMovingToHitList) {
    let validWeekStartDate = weekStartDate
    if (!validWeekStartDate || validWeekStartDate.trim() === "") {
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      const year = monday.getFullYear()
      const month = String(monday.getMonth() + 1).padStart(2, "0")
      const dayStr = String(monday.getDate()).padStart(2, "0")
      validWeekStartDate = `${year}-${month}-${dayStr}`
    }

    await copyDoorTaskToHitList(taskId, newColumn, newPosition, validWeekStartDate)
    return
  }

  let originColumn = task.origin_column

  if (task.column_name === "hot_list" && newColumn.startsWith("hit_list_")) {
    originColumn = "hot_list"
  }

  if (newColumn === "done" && task.column_name !== "done") {
    originColumn = task.column_name
  }

  if (task.column_name === "done" && newColumn !== "done") {
    originColumn = null
  }

  let targetWeekStartDate = null

  if (newColumn.startsWith("hit_list_") || newColumn === "the_door") {
    if (weekStartDate && weekStartDate.trim() !== "") {
      targetWeekStartDate = weekStartDate
    } else {
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(now.setDate(diff))
      const year = monday.getFullYear()
      const month = String(monday.getMonth() + 1).padStart(2, "0")
      const dayStr = String(monday.getDate()).padStart(2, "0")
      targetWeekStartDate = `${year}-${month}-${dayStr}`
      console.log("[v0] Calculated fallback week start date:", targetWeekStartDate)
    }
  } else if (newColumn === "done") {
    targetWeekStartDate = task.week_start_date
  } else if (task.column_name.startsWith("hit_list_") || task.column_name === "the_door") {
    targetWeekStartDate = null
  } else {
    targetWeekStartDate = task.week_start_date
  }

  console.log("[v0] Final targetWeekStartDate:", targetWeekStartDate)

  let newLabel = task.label

  if (newColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  } else if (newColumn === "the_door") {
    newLabel = "Door"
  } else if (newColumn === "hot_list") {
    newLabel = task.label
  }

  const newCompleted = newColumn === "done" ? true : task.column_name === "done" ? false : task.completed
  const newCompletedAt =
    newColumn === "done" ? new Date().toISOString() : task.column_name === "done" ? null : task.completed_at

  // Update positions
  let updateQuery = supabase
    .from("tasks")
    .update({ position: supabase.sql`position + 1` })
    .eq("user_id", userId)
    .eq("column_name", newColumn)
    .gte("position", newPosition)

  if (targetWeekStartDate) {
    updateQuery = updateQuery.eq("week_start_date", targetWeekStartDate)
  } else {
    updateQuery = updateQuery.is("week_start_date", null)
  }

  await updateQuery

  // Move task
  await supabase
    .from("tasks")
    .update({
      column_name: newColumn,
      position: newPosition,
      week_start_date: targetWeekStartDate,
      origin_column: originColumn,
      label: newLabel,
      completed: newCompleted,
      completed_at: newCompletedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId)
}

export async function reorderTaskToPosition(taskId: number, overTaskId: number) {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  const { data: overTask } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", overTaskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !task || !overTask || task.column_name !== overTask.column_name) {
    throw new Error("Tasks not found, unauthorized, or in different columns")
  }

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("column_name", task.column_name)
    .order("position", { ascending: true })

  if (task.week_start_date) {
    query = query.eq("week_start_date", task.week_start_date)
  } else {
    query = query.is("week_start_date", null)
  }

  const { data: columnTasks } = await query

  if (!columnTasks) return

  const taskIndex = columnTasks.findIndex((t: Task) => t.id === taskId)
  const overIndex = columnTasks.findIndex((t: Task) => t.id === overTaskId)

  if (taskIndex === -1 || overIndex === -1) return

  const reordered = [...columnTasks]
  const [removed] = reordered.splice(taskIndex, 1)
  reordered.splice(overIndex, 0, removed)

  for (let i = 0; i < reordered.length; i++) {
    await supabase
      .from("tasks")
      .update({ position: i, updated_at: new Date().toISOString() })
      .eq("id", reordered[i].id)
      .eq("user_id", userId)
  }
}

export async function moveTaskBetweenDoorAndHitList(
  taskId: number,
  targetColumn: string,
  newPosition: number,
  weekStartDate?: string,
) {
  const userId = await getUserId()
  const supabase = await createClient()

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !task) {
    throw new Error("Task not found or unauthorized")
  }

  // Update positions
  let updateQuery = supabase
    .from("tasks")
    .update({ position: supabase.sql`position + 1` })
    .eq("user_id", userId)
    .eq("column_name", targetColumn)
    .gte("position", newPosition)

  if (weekStartDate) {
    updateQuery = updateQuery.eq("week_start_date", weekStartDate)
  } else {
    updateQuery = updateQuery.is("week_start_date", null)
  }

  await updateQuery

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
  const userId = await getUserId()
  const supabase = await createClient()

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
