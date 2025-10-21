-- Add is_moved_to_hitlist field to track when Door tasks are moved to Hit List
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_moved_to_hitlist BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_linked_task_id ON tasks(linked_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_origin_column ON tasks(origin_column);
