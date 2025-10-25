import { sql as vercelSql } from "@vercel/postgres"

export const sql = vercelSql

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
