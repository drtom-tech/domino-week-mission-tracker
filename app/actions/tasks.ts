"use server"

import { sql, type Task } from "@/lib/db-direct"
import { getUserId } from "@/lib/get-user-id"

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: "Review project requirements",
    description: "Go through all the requirements and make notes",
    column_name: "hot_list",
    position: 0,
    completed: false,
    user_id: 1,
    label: null,
    parent_id: null,
    week_start_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    linked_task_id: null,
    origin_column: null,
    clerk_user_id: null,
  },
  {
    id: 2,
    title: "Design database schema",
    description: null,
    column_name: "the_door",
    position: 0,
    completed: false,
    user_id: 1,
    label: "Door",
    parent_id: null,
    week_start_date: "2025-10-20",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    linked_task_id: null,
    origin_column: null,
    is_moved_to_hitlist: false,
    clerk_user_id: null,
  },
]

const mockTasksState = [...MOCK_TASKS]
const nextMockId = 3

export async function getTasks(weekStartDate?: string) {
  try {
    const userId = await getUserId()

    if (weekStartDate) {
      const tasks = await sql`
        SELECT * FROM tasks 
        WHERE user_id = ${userId} 
        AND (week_start_date = ${weekStartDate} OR week_start_date IS NULL)
        ORDER BY position ASC
      `
      return tasks as Task[]
    } else {
      const tasks = await sql`
        SELECT * FROM tasks 
        WHERE user_id = ${userId}
        ORDER BY position ASC
      `
      return tasks as Task[]
    }
  } catch (error) {
    console.error("[v0] getTasks error:", error)
    return []
  }
}

export async function createTask(data: {
  title: string
  description?: string
  columnName: string
  parentId?: number
  weekStartDate?: string
}) {
  try {
    const userId = await getUserId()

    console.log("[v0] createTask - userId:", userId)
    console.log("[v0] createTask - data:", data)

    let maxPosition = 0
    if (data.weekStartDate) {
      console.log("[v0] Querying max position with weekStartDate:", data.weekStartDate)
      const result = await sql`
        SELECT COALESCE(MAX(position), -1) as max_pos
        FROM tasks
        WHERE user_id = ${userId}
        AND column_name = ${data.columnName}
        AND week_start_date = ${data.weekStartDate}
      `
      console.log("[v0] Max position query result:", result)
      maxPosition = result[0]?.max_pos ?? -1
    } else {
      console.log("[v0] Querying max position without weekStartDate")
      const result = await sql`
        SELECT COALESCE(MAX(position), -1) as max_pos
        FROM tasks
        WHERE user_id = ${userId}
        AND column_name = ${data.columnName}
      `
      console.log("[v0] Max position query result:", result)
      maxPosition = result[0]?.max_pos ?? -1
    }

    const newPosition = maxPosition + 1
    console.log("[v0] New position:", newPosition)

    console.log("[v0] Inserting new task...")
    await sql`
      INSERT INTO tasks (
        user_id, title, description, column_name, position, parent_id, week_start_date
      ) VALUES (
        ${userId},
        ${data.title},
        ${data.description || null},
        ${data.columnName},
        ${newPosition},
        ${data.parentId || null},
        ${data.weekStartDate || null}
      )
    `
    console.log("[v0] Task inserted successfully")
  } catch (error) {
    console.error("[v0] createTask error:", error)
    console.error("[v0] createTask error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] createTask error stack:", error instanceof Error ? error.stack : "No stack trace")
    if (error && typeof error === "object") {
      console.error("[v0] createTask error details:", JSON.stringify(error, null, 2))
    }
    throw error
  }
}

export async function copyDoorTaskToHitList(
  taskId: number,
  newColumn: string,
  newPosition: number,
  weekStartDate: string,
) {
  const userId = await getUserId()

  const { data: originalTask, error: fetchError } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (fetchError || !originalTask || originalTask.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  const { data: existingCopy } = await sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId} 
    AND linked_task_id = ${taskId} 
    AND column_name = ${newColumn} 
    AND week_start_date = ${weekStartDate}
  `

  if (existingCopy && existingCopy.length > 0) return

  // Update positions
  await sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId} 
    AND column_name = ${newColumn} 
    AND position >= ${newPosition} 
    AND week_start_date = ${weekStartDate}
  `

  // Insert new task
  const { data: newTaskData } = await sql`
    INSERT INTO tasks (
      user_id, title, description, label, column_name, position, parent_id, week_start_date, linked_task_id, completed
    ) VALUES (
      ${userId},
      ${originalTask[0].title},
      ${originalTask[0].description || null},
      'Hit',
      ${newColumn},
      ${newPosition},
      NULL,
      ${weekStartDate},
      ${taskId},
      FALSE
    )
    RETURNING *
  `

  if (!newTaskData || newTaskData.length === 0) throw new Error("Failed to insert new task")

  const newTask = newTaskData[0]

  // Update original task
  await sql`
    UPDATE tasks 
    SET linked_task_id = ${newTask.id} 
    WHERE id = ${taskId} AND user_id = ${userId}
  `
}

export async function copyTaskFromHotList(
  taskId: number,
  targetColumn: string,
  newPosition: number,
  weekStartDate?: string,
) {
  const userId = await getUserId()

  const { data: originalTask, error: fetchError } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (fetchError || !originalTask || originalTask.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  const { data: existingCopy } = await sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId} 
    AND linked_task_id = ${taskId} 
    AND column_name = ${targetColumn} 
    AND week_start_date = ${weekStartDate || null}
  `

  if (existingCopy && existingCopy.length > 0) {
    return existingCopy[0].id
  }

  // Update positions
  let updateQuery = sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId} 
    AND column_name = ${targetColumn} 
    AND position >= ${newPosition}
  `

  if (weekStartDate) {
    updateQuery = updateQuery.append(sql`AND week_start_date = ${weekStartDate}`)
  } else {
    updateQuery = updateQuery.append(sql`AND week_start_date IS NULL`)
  }

  await updateQuery

  let newLabel = originalTask[0].label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const { data: newTaskData } = await sql`
    INSERT INTO tasks (
      user_id, title, description, label, column_name, position, parent_id, week_start_date, linked_task_id, origin_column, completed
    ) VALUES (
      ${userId},
      ${originalTask[0].title},
      ${originalTask[0].description || null},
      ${newLabel},
      ${targetColumn},
      ${newPosition},
      NULL,
      ${weekStartDate || null},
      ${taskId},
      'hot_list',
      FALSE
    )
    RETURNING *
  `

  if (!newTaskData || newTaskData.length === 0) throw new Error("Failed to insert new task")

  const newTask = newTaskData[0]

  // Update original task
  await sql`
    UPDATE tasks 
    SET linked_task_id = ${newTask.id} 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  return newTask.id
}

export async function updateTask(id: number, data: Partial<Task>) {
  try {
    const userId = await getUserId()

    const tasks = await sql`
      SELECT * FROM tasks 
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (!tasks || tasks.length === 0) {
      throw new Error("Task not found or unauthorized")
    }

    const task = tasks[0]

    // Build update fields
    const updates: string[] = []
    const values: any[] = []

    if (data.title !== undefined) {
      updates.push(`title = $${updates.length + 1}`)
      values.push(data.title)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${updates.length + 1}`)
      values.push(data.description)
    }
    if (data.column_name !== undefined) {
      updates.push(`column_name = $${updates.length + 1}`)
      values.push(data.column_name)
    }
    if (data.position !== undefined) {
      updates.push(`position = $${updates.length + 1}`)
      values.push(data.position)
    }

    updates.push(`updated_at = NOW()`)

    if (updates.length > 0) {
      await sql`
        UPDATE tasks 
        SET ${sql(updates.join(", "))}
        WHERE id = ${id} AND user_id = ${userId}
      `
    }

    // Update linked task if exists
    if (task.linked_task_id) {
      await sql`
        UPDATE tasks 
        SET updated_at = NOW()
        WHERE id = ${task.linked_task_id} AND user_id = ${userId}
      `
    }
  } catch (error) {
    console.error("[v0] updateTask error:", error)
    throw error
  }
}

export async function deleteTask(id: number) {
  try {
    const userId = await getUserId()

    await sql`
      DELETE FROM tasks 
      WHERE id = ${id} AND user_id = ${userId}
    `
  } catch (error) {
    console.error("[v0] deleteTask error:", error)
    throw error
  }
}

export async function reorderTask(taskId: number, direction: "up" | "down") {
  const userId = await getUserId()

  const { data: task } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!task || task.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  let query = sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId} 
    AND column_name = ${task[0].column_name}
    ORDER BY position ASC
  `

  if (task[0].week_start_date) {
    query = query.append(sql`AND week_start_date = ${task[0].week_start_date}`)
  } else {
    query = query.append(sql`AND week_start_date IS NULL`)
  }

  const { data: columnTasks } = await query

  if (!columnTasks || columnTasks.length === 0) return

  const currentIndex = columnTasks.findIndex((t: Task) => t.id === taskId)
  if (currentIndex === -1) return

  if (direction === "up" && currentIndex === 0) return
  if (direction === "down" && currentIndex === columnTasks.length - 1) return

  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  const swapTask = columnTasks[swapIndex]

  await sql`
    UPDATE tasks 
    SET position = ${swapTask.position} 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  await sql`
    UPDATE tasks 
    SET position = ${task[0].position} 
    WHERE id = ${swapTask.id} AND user_id = ${userId}
  `
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

  const { data: task } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!task || task.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  console.log("[v0] Task details:", {
    id: task[0].id,
    title: task[0].title,
    column_name: task[0].column_name,
    linked_task_id: task[0].linked_task_id,
    parent_id: task[0].parent_id,
    label: task[0].label,
  })

  const isHitListCopyMovingToDoor =
    task[0].column_name.startsWith("hit_list_") && newColumn === "the_door" && task[0].linked_task_id

  console.log("[v0] isHitListCopyMovingToDoor:", isHitListCopyMovingToDoor)

  if (isHitListCopyMovingToDoor) {
    console.log("[v0] Hit List copy being moved back to Door - initiating merge")

    const { data: doorOriginal } = await sql`
      SELECT * FROM tasks 
      WHERE id = ${task[0].linked_task_id} AND user_id = ${userId}
    `

    if (!doorOriginal || doorOriginal.length === 0) {
      console.log("[v0] ERROR: Door original not found for linked_task_id:", task[0].linked_task_id)
      throw new Error("Linked task not found or unauthorized")
    }

    console.log("[v0] Door original found:", {
      id: doorOriginal[0].id,
      title: doorOriginal[0].title,
      parent_id: doorOriginal[0].parent_id,
      column_name: doorOriginal[0].column_name,
      label: doorOriginal[0].label,
    })

    const isDoorSubtask =
      doorOriginal[0].parent_id && doorOriginal[0].column_name === "the_door" && doorOriginal[0].label === "Door"

    if (isDoorSubtask) {
      console.log("[v0] Merging: Restoring Door subtask, deleting Hit List copy")

      await sql`
        UPDATE tasks 
        SET linked_task_id = NULL, updated_at = NOW()
        WHERE id = ${task[0].linked_task_id} AND user_id = ${userId}
      `

      await sql`
        DELETE FROM tasks 
        WHERE id = ${taskId} AND user_id = ${userId}
      `

      console.log("[v0] Merge complete: Door subtask restored to normal, Hit List copy deleted")
      return
    } else {
      console.log("[v0] Door original is a main task (not subtask) - restoring it")

      await sql`
        UPDATE tasks 
        SET linked_task_id = NULL, updated_at = NOW()
        WHERE id = ${task[0].linked_task_id} AND user_id = ${userId}
      `

      await sql`
        DELETE FROM tasks 
        WHERE id = ${taskId} AND user_id = ${userId}
      `

      console.log("[v0] Hit List copy deleted, Door main task restored")
      return
    }
  }

  const isDoorSubtask = task[0].label === "Door" && task[0].parent_id && task[0].column_name === "the_door"
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

  let originColumn = task[0].origin_column

  if (task[0].column_name === "hot_list" && newColumn.startsWith("hit_list_")) {
    originColumn = "hot_list"
  }

  if (newColumn === "done" && task[0].column_name !== "done") {
    originColumn = task[0].column_name
  }

  if (task[0].column_name === "done" && newColumn !== "done") {
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
    targetWeekStartDate = task[0].week_start_date
  } else if (task[0].column_name.startsWith("hit_list_") || task[0].column_name === "the_door") {
    targetWeekStartDate = null
  } else {
    targetWeekStartDate = task[0].week_start_date
  }

  console.log("[v0] Final targetWeekStartDate:", targetWeekStartDate)

  let newLabel = task[0].label

  if (newColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  } else if (newColumn === "the_door") {
    newLabel = "Door"
  } else if (newColumn === "hot_list") {
    newLabel = task[0].label
  }

  const newCompleted = newColumn === "done" ? true : task[0].column_name === "done" ? false : task[0].completed
  const newCompletedAt =
    newColumn === "done" ? new Date().toISOString() : task[0].column_name === "done" ? null : task[0].completed_at

  // Update positions
  let updateQuery = sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId} 
    AND column_name = ${newColumn} 
    AND position >= ${newPosition}
  `

  if (targetWeekStartDate) {
    updateQuery = updateQuery.append(sql`AND week_start_date = ${targetWeekStartDate}`)
  } else {
    updateQuery = updateQuery.append(sql`AND week_start_date IS NULL`)
  }

  await updateQuery

  // Move task
  await sql`
    UPDATE tasks 
    SET column_name = ${newColumn}, position = ${newPosition}, week_start_date = ${targetWeekStartDate}, origin_column = ${originColumn}, label = ${newLabel}, completed = ${newCompleted}, completed_at = ${newCompletedAt}, updated_at = NOW()
    WHERE id = ${taskId} AND user_id = ${userId}
  `
}

export async function reorderTaskToPosition(taskId: number, overTaskId: number) {
  const userId = await getUserId()

  const { data: task } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  const { data: overTask } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${overTaskId} AND user_id = ${userId}
  `

  if (
    !task ||
    task.length === 0 ||
    !overTask ||
    overTask.length === 0 ||
    task[0].column_name !== overTask[0].column_name
  ) {
    throw new Error("Tasks not found, unauthorized, or in different columns")
  }

  let query = sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId} 
    AND column_name = ${task[0].column_name}
    ORDER BY position ASC
  `

  if (task[0].week_start_date) {
    query = query.append(sql`AND week_start_date = ${task[0].week_start_date}`)
  } else {
    query = query.append(sql`AND week_start_date IS NULL`)
  }

  const { data: columnTasks } = await query

  if (!columnTasks || columnTasks.length === 0) return

  const taskIndex = columnTasks.findIndex((t: Task) => t.id === taskId)
  const overIndex = columnTasks.findIndex((t: Task) => t.id === overTaskId)

  if (taskIndex === -1 || overIndex === -1) return

  const reordered = [...columnTasks]
  const [removed] = reordered.splice(taskIndex, 1)
  reordered.splice(overIndex, 0, removed)

  for (let i = 0; i < reordered.length; i++) {
    await sql`
      UPDATE tasks 
      SET position = ${i}, updated_at = NOW()
      WHERE id = ${reordered[i].id} AND user_id = ${userId}
    `
  }
}

export async function moveTaskBetweenDoorAndHitList(
  taskId: number,
  targetColumn: string,
  newPosition: number,
  weekStartDate?: string,
) {
  const userId = await getUserId()

  const { data: task } = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!task || task.length === 0) {
    throw new Error("Task not found or unauthorized")
  }

  // Update positions
  let updateQuery = sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId} 
    AND column_name = ${targetColumn} 
    AND position >= ${newPosition}
  `

  if (weekStartDate) {
    updateQuery = updateQuery.append(sql`AND week_start_date = ${weekStartDate}`)
  } else {
    updateQuery = updateQuery.append(sql`AND week_start_date IS NULL`)
  }

  await updateQuery

  let newLabel = task[0].label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const isMovingFromDoorToHitList = task[0].column_name === "the_door" && targetColumn.startsWith("hit_list_")

  await sql`
    UPDATE tasks 
    SET column_name = ${targetColumn}, position = ${newPosition}, week_start_date = ${weekStartDate || null}, label = ${newLabel}, is_moved_to_hitlist = ${isMovingFromDoorToHitList}, updated_at = NOW()
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (task[0].linked_task_id) {
    await sql`
      UPDATE tasks 
      SET updated_at = NOW()
      WHERE id = ${task[0].linked_task_id} AND user_id = ${userId}
    `
  }
}

export async function checkAndResetWeekly() {
  const userId = await getUserId()

  const { data: setting } = await sql`
    SELECT value FROM settings 
    WHERE key = 'last_weekly_reset'
  `

  if (!setting || setting.length === 0) return

  const lastReset = Number.parseInt(setting[0].value)
  const now = Date.now() / 1000
  const oneWeek = 7 * 24 * 60 * 60

  const currentDate = new Date()
  const dayOfWeek = currentDate.getDay()

  if (dayOfWeek === 1 && now - lastReset >= oneWeek) {
    await sql`
      UPDATE tasks 
      SET column_name = 'done', completed = TRUE, completed_at = NOW(), updated_at = NOW()
      WHERE user_id = ${userId} AND column_name LIKE 'hit_list_%'
    `

    await sql`
      UPDATE settings 
      SET value = ${now.toString()}, updated_at = NOW()
      WHERE key = 'last_weekly_reset'
    `
  }
}
