"use server"

import { sql, type Task } from "@/lib/db"
import { getUserId } from "@/lib/get-user-id"

export async function getTasks(weekStartDate?: string) {
  console.log("[v0] getTasks called with weekStartDate:", weekStartDate)

  try {
    const userId = await getUserId()
    console.log("[v0] getTasks using userId:", userId)

    if (weekStartDate) {
      const tasks = await sql`
        SELECT * FROM tasks 
        WHERE user_id = ${userId}
          AND ((week_start_date::date = ${weekStartDate}::date) OR week_start_date IS NULL)
        ORDER BY position ASC
      `
      console.log("[v0] getTasks found", tasks.length, "tasks for week", weekStartDate)
      return tasks as Task[]
    }

    const tasks = await sql`
      SELECT * FROM tasks 
      WHERE user_id = ${userId}
      ORDER BY position ASC
    `
    console.log("[v0] getTasks found", tasks.length, "total tasks")
    return tasks as Task[]
  } catch (error) {
    console.error("[v0] getTasks error:", error)
    // Return empty array instead of throwing to prevent error screen
    // New users won't have any tasks yet
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

  const userId = await getUserId()
  console.log("[v0] createTask using userId:", userId)

  try {
    const maxPosition = await sql`
      SELECT COALESCE(MAX(position), -1) as max_pos 
      FROM tasks 
      WHERE user_id = ${userId} AND column_name = ${data.columnName}
      ${data.weekStartDate ? sql`AND week_start_date = ${data.weekStartDate}` : sql``}
    `
    const newPosition = (maxPosition[0]?.max_pos ?? -1) + 1

    console.log("[v0] createTask newPosition:", newPosition)

    const result = await sql`
      INSERT INTO tasks (user_id, title, description, label, column_name, position, parent_id, week_start_date)
      VALUES (
        ${userId},
        ${data.title}, 
        ${data.description || null}, 
        ${data.label || null}, 
        ${data.columnName}, 
        ${newPosition}, 
        ${data.parentId || null},
        ${data.weekStartDate || null}
      )
      RETURNING id
    `

    console.log("[v0] createTask success, new task ID:", result[0]?.id)
    return result[0]
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
  const userId = await getUserId()

  const [originalTask] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!originalTask) {
    throw new Error("Task not found or unauthorized")
  }

  const [existingCopy] = await sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId}
      AND linked_task_id = ${taskId} 
      AND column_name = ${newColumn}
      AND week_start_date::date = ${weekStartDate}::date
  `

  if (existingCopy) {
    return
  }

  await sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId}
      AND column_name = ${newColumn} 
      AND position >= ${newPosition}
      AND week_start_date::date = ${weekStartDate}::date
  `

  const [newTask] = await sql`
    INSERT INTO tasks (
      user_id,
      title, 
      description, 
      label, 
      column_name, 
      position, 
      parent_id, 
      week_start_date,
      linked_task_id,
      completed
    )
    VALUES (
      ${userId},
      ${originalTask.title}, 
      ${originalTask.description || null}, 
      'Hit',
      ${newColumn}, 
      ${newPosition}, 
      ${null},
      ${weekStartDate},
      ${taskId},
      ${false}
    )
    RETURNING id
  `

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

  const [originalTask] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!originalTask) {
    throw new Error("Task not found or unauthorized")
  }

  const [existingCopy] = await sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId}
      AND linked_task_id = ${taskId} 
      AND column_name = ${targetColumn}
      ${weekStartDate ? sql`AND week_start_date::date = ${weekStartDate}::date` : sql`AND week_start_date IS NULL`}
  `

  if (existingCopy) {
    return existingCopy.id
  }

  await sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId}
      AND column_name = ${targetColumn} 
      AND position >= ${newPosition}
      ${weekStartDate ? sql`AND week_start_date::date = ${weekStartDate}::date` : sql`AND week_start_date IS NULL`}
  `

  let newLabel = originalTask.label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const [newTask] = await sql`
    INSERT INTO tasks (
      user_id,
      title, 
      description, 
      label, 
      column_name, 
      position, 
      parent_id, 
      week_start_date,
      linked_task_id,
      origin_column,
      completed
    )
    VALUES (
      ${userId},
      ${originalTask.title}, 
      ${originalTask.description || null}, 
      ${newLabel}, 
      ${targetColumn}, 
      ${newPosition}, 
      ${null},
      ${weekStartDate || null},
      ${taskId},
      'hot_list',
      false
    )
    RETURNING id
  `

  await sql`
    UPDATE tasks 
    SET linked_task_id = ${newTask.id}
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  return newTask.id
}

export async function updateTask(id: number, data: Partial<Task>) {
  const userId = await getUserId()

  const [task] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${id} AND user_id = ${userId}
  `

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.label !== undefined) {
    updates.push(`label = $${paramIndex++}`)
    values.push(data.label)
  }
  if (data.column_name !== undefined) {
    updates.push(`column_name = $${paramIndex++}`)
    values.push(data.column_name)
  }
  if (data.position !== undefined) {
    updates.push(`position = $${paramIndex++}`)
    values.push(data.position)
  }
  if (data.completed !== undefined) {
    updates.push(`completed = $${paramIndex++}`)
    values.push(data.completed)
    if (data.completed) {
      updates.push(`completed_at = CURRENT_TIMESTAMP`)
    } else {
      updates.push(`completed_at = NULL`)
    }
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  updates.push(`user_id = $${paramIndex++}`)
  values.push(userId)
  values.push(id)

  const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramIndex} AND user_id = $${paramIndex - 1}`

  await sql.query(query, values)

  if (data.completed !== undefined) {
    const [linkedTask] = await sql`
      SELECT linked_task_id FROM tasks 
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (linkedTask?.linked_task_id) {
      await sql`
        UPDATE tasks 
        SET completed = ${data.completed},
            completed_at = ${data.completed ? sql`CURRENT_TIMESTAMP` : null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${linkedTask.linked_task_id} AND user_id = ${userId}
      `
    }
  }
}

export async function deleteTask(id: number) {
  const userId = await getUserId()

  const [task] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${id} AND user_id = ${userId}
  `

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  await sql`
    DELETE FROM tasks 
    WHERE id = ${id} AND user_id = ${userId}
  `
}

export async function reorderTask(taskId: number, direction: "up" | "down") {
  const userId = await getUserId()

  const [task] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  const columnTasks = await sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId}
      AND column_name = ${task.column_name}
      ${task.week_start_date ? sql`AND week_start_date::date = ${task.week_start_date}::date` : sql`AND week_start_date IS NULL`}
    ORDER BY position ASC
  `

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
    SET position = ${task.position}
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

  const [task] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!task) {
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

    const [doorOriginal] = await sql`
      SELECT * FROM tasks 
      WHERE id = ${task.linked_task_id} AND user_id = ${userId}
    `

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

      await sql`
        UPDATE tasks 
        SET linked_task_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${task.linked_task_id} AND user_id = ${userId}
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
        SET linked_task_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${task.linked_task_id} AND user_id = ${userId}
      `

      await sql`
        DELETE FROM tasks 
        WHERE id = ${taskId} AND user_id = ${userId}
      `

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
  const newCompletedAt = newColumn === "done" ? new Date() : task.column_name === "done" ? null : task.completed_at

  await sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId}
      AND column_name = ${newColumn} 
      AND position >= ${newPosition}
      ${targetWeekStartDate ? sql`AND week_start_date::date = ${targetWeekStartDate}::date` : sql`AND week_start_date IS NULL`}
  `

  await sql`
    UPDATE tasks 
    SET column_name = ${newColumn}, 
        position = ${newPosition}, 
        week_start_date = ${targetWeekStartDate},
        origin_column = ${originColumn},
        label = ${newLabel},
        completed = ${newCompleted},
        completed_at = ${newCompletedAt},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${taskId} AND user_id = ${userId}
  `
}

export async function reorderTaskToPosition(taskId: number, overTaskId: number) {
  const userId = await getUserId()

  const [task] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `
  const [overTask] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${overTaskId} AND user_id = ${userId}
  `

  if (!task || !overTask || task.column_name !== overTask.column_name) {
    throw new Error("Tasks not found, unauthorized, or in different columns")
  }

  const columnTasks = await sql`
    SELECT * FROM tasks 
    WHERE user_id = ${userId}
      AND column_name = ${task.column_name}
      ${task.week_start_date ? sql`AND week_start_date::date = ${task.week_start_date}::date` : sql`AND week_start_date IS NULL`}
    ORDER BY position ASC
  `

  const taskIndex = columnTasks.findIndex((t: Task) => t.id === taskId)
  const overIndex = columnTasks.findIndex((t: Task) => t.id === overTaskId)

  if (taskIndex === -1 || overIndex === -1) return

  const reordered = [...columnTasks]
  const [removed] = reordered.splice(taskIndex, 1)
  reordered.splice(overIndex, 0, removed)

  for (let i = 0; i < reordered.length; i++) {
    await sql`
      UPDATE tasks 
      SET position = ${i}, updated_at = CURRENT_TIMESTAMP
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

  const [task] = await sql`
    SELECT * FROM tasks 
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (!task) {
    throw new Error("Task not found or unauthorized")
  }

  await sql`
    UPDATE tasks 
    SET position = position + 1 
    WHERE user_id = ${userId}
      AND column_name = ${targetColumn} 
      AND position >= ${newPosition}
      ${weekStartDate ? sql`AND week_start_date::date = ${weekStartDate}::date` : sql`AND week_start_date IS NULL`}
  `

  let newLabel = task.label
  if (targetColumn === "the_door") {
    newLabel = "Door"
  } else if (targetColumn.startsWith("hit_list_")) {
    newLabel = "Hit"
  }

  const isMovingFromDoorToHitList = task.column_name === "the_door" && targetColumn.startsWith("hit_list_")

  await sql`
    UPDATE tasks 
    SET column_name = ${targetColumn}, 
        position = ${newPosition}, 
        week_start_date = ${weekStartDate || null},
        label = ${newLabel},
        is_moved_to_hitlist = ${isMovingFromDoorToHitList ? true : sql`is_moved_to_hitlist`},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${taskId} AND user_id = ${userId}
  `

  if (task.linked_task_id) {
    await sql`
      UPDATE tasks 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${task.linked_task_id} AND user_id = ${userId}
    `
  }
}

export async function checkAndResetWeekly() {
  const userId = await getUserId()

  const [setting] = await sql`SELECT value FROM settings WHERE key = 'last_weekly_reset'`

  if (!setting) return

  const lastReset = Number.parseInt(setting.value)
  const now = Date.now() / 1000
  const oneWeek = 7 * 24 * 60 * 60

  const currentDate = new Date()
  const dayOfWeek = currentDate.getDay()

  if (dayOfWeek === 1 && now - lastReset >= oneWeek) {
    await sql`
      UPDATE tasks 
      SET column_name = 'done', completed = true, completed_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND column_name LIKE 'hit_list_%'
    `

    await sql`
      UPDATE settings 
      SET value = ${now.toString()}, updated_at = CURRENT_TIMESTAMP
      WHERE key = 'last_weekly_reset'
    `
  }
}
