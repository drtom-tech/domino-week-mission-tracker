// In-memory database for v0 preview mode
type PreviewTask = {
  id: number
  user_id: string
  title: string
  description: string | null
  label: string | null
  column_name: string
  position: number
  parent_id: number | null
  completed: boolean
  created_at: string
  updated_at: string
  completed_at: string | null
  week_start_date: string | null
  linked_task_id: number | null
  origin_column: string | null
  is_moved_to_hitlist: boolean | null
}

let tasks: PreviewTask[] = []
let nextId = 1

// Helper to parse SQL template literals
function parseQuery(strings: TemplateStringsArray, ...values: any[]) {
  let query = ""
  for (let i = 0; i < strings.length; i++) {
    query += strings[i]
    if (i < values.length) {
      query += `$${i + 1}`
    }
  }
  return { query, values }
}

// Mock SQL function that stores data in memory
export function createPreviewSql() {
  const sqlFunction: any = (strings: TemplateStringsArray, ...values: any[]) => {
    const { query } = parseQuery(strings, values)

    console.log("[v0] Preview DB query:", query.substring(0, 100))
    console.log("[v0] Preview DB values:", values)

    // Handle SELECT queries
    if (query.trim().toUpperCase().startsWith("SELECT")) {
      if (query.includes("FROM tasks")) {
        let filtered = [...tasks]

        // Filter by user_id
        const userIdIndex = values.findIndex((v) => typeof v === "string" && v.startsWith("user-"))
        if (userIdIndex !== -1) {
          const userId = values[userIdIndex]
          filtered = filtered.filter((t) => t.user_id === userId)
        }

        // Filter by column_name
        const columnMatch = query.match(/column_name\s*=\s*\$(\d+)/)
        if (columnMatch) {
          const paramIndex = Number.parseInt(columnMatch[1]) - 1
          const columnName = values[paramIndex]
          filtered = filtered.filter((t) => t.column_name === columnName)
        }

        // Filter by week_start_date
        const weekMatch = query.match(/week_start_date.*=\s*\$(\d+)/)
        if (weekMatch) {
          const paramIndex = Number.parseInt(weekMatch[1]) - 1
          const weekStartDate = values[paramIndex]
          if (weekStartDate) {
            filtered = filtered.filter((t) => t.week_start_date === weekStartDate)
          }
        }

        // Handle MAX(position) query
        if (query.includes("MAX(position)")) {
          const maxPos = filtered.length > 0 ? Math.max(...filtered.map((t) => t.position)) : -1
          console.log("[v0] Preview DB returning max position:", maxPos)
          return Promise.resolve([{ max_pos: maxPos }])
        }

        // Order by position
        if (query.includes("ORDER BY position")) {
          filtered.sort((a, b) => a.position - b.position)
        }

        console.log("[v0] Preview DB returning", filtered.length, "tasks")
        return Promise.resolve(filtered)
      }

      // Handle other SELECT queries (settings, etc.)
      return Promise.resolve([])
    }

    // Handle INSERT queries
    if (query.trim().toUpperCase().startsWith("INSERT INTO tasks")) {
      const newTask: PreviewTask = {
        id: nextId++,
        user_id: values[0],
        title: values[1],
        description: values[2],
        label: values[3],
        column_name: values[4],
        position: values[5],
        parent_id: values[6],
        week_start_date: values[7],
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        linked_task_id: null,
        origin_column: null,
        is_moved_to_hitlist: null,
      }

      tasks.push(newTask)
      console.log("[v0] Preview DB inserted task:", newTask.id, newTask.title)
      return Promise.resolve([{ id: newTask.id }])
    }

    // Handle UPDATE queries
    if (query.trim().toUpperCase().startsWith("UPDATE tasks")) {
      // Extract the task ID from the WHERE clause
      const whereMatch = query.match(/WHERE\s+id\s*=\s*\$(\d+)/)
      if (whereMatch) {
        const paramIndex = Number.parseInt(whereMatch[1]) - 1
        const taskId = values[paramIndex]
        const taskIndex = tasks.findIndex((t) => t.id === taskId)

        if (taskIndex !== -1) {
          // Update the task (simplified - just update common fields)
          tasks[taskIndex].updated_at = new Date().toISOString()
          console.log("[v0] Preview DB updated task:", taskId)
        }
      }
      return Promise.resolve([])
    }

    // Handle DELETE queries
    if (query.trim().toUpperCase().startsWith("DELETE FROM tasks")) {
      const whereMatch = query.match(/WHERE\s+id\s*=\s*\$(\d+)/)
      if (whereMatch) {
        const paramIndex = Number.parseInt(whereMatch[1]) - 1
        const taskId = values[paramIndex]
        tasks = tasks.filter((t) => t.id !== taskId)
        console.log("[v0] Preview DB deleted task:", taskId)
      }
      return Promise.resolve([])
    }

    // Default: return empty array
    console.log("[v0] Preview DB: unhandled query type")
    return Promise.resolve([])
  }

  // Add query method for raw SQL
  sqlFunction.query = (query: string, values: any[]) => {
    console.log("[v0] Preview DB raw query:", query)
    return Promise.resolve({ rows: [] })
  }

  return sqlFunction
}
