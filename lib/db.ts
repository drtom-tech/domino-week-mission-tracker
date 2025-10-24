import { neon } from "@neondatabase/serverless"
import { createPreviewSql } from "./preview-db"

// Function to detect v0 preview mode
function isV0Preview() {
  const vercelUrl = process.env.VERCEL_URL || ""
  return vercelUrl.includes("vusercontent.net") || vercelUrl.includes("v0.app")
}

// Create a mock sql function for preview mode
// const mockSql = (() => {
//   const fn = () => Promise.resolve([])
//   return Object.assign(fn, {
//     transaction: () => Promise.resolve([]),
//   })
// })()

// Export sql directly - either real or mock based on environment
export const sql = isV0Preview() ? createPreviewSql() : neon(process.env.DATABASE_URL || "")

export type TaskLabel = "Door" | "Hit" | "To-Do" | "Mission"

export type Task = {
  id: number
  title: string
  description: string | null
  label: TaskLabel | null
  column_name: string
  position: number
  parent_id: number | null
  completed: boolean
  created_at: string
  updated_at: string
  completed_at: string | null
  week_start_date: string | null
  linked_task_id: number | null // Links copies to originals (bidirectional)
  origin_column: string | null // Tracks original column when moved
  is_moved_to_hitlist: boolean | null // Added to track Door tasks moved to Hit List
}
