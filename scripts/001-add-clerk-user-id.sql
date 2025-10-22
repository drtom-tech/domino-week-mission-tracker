-- Add clerk_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Add clerk_user_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add clerk_user_id column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_clerk_user_id ON tasks(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_settings_clerk_user_id ON settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Add comments for documentation
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user ID for authentication';
COMMENT ON COLUMN tasks.clerk_user_id IS 'Clerk user ID - owner of this task';
COMMENT ON COLUMN settings.clerk_user_id IS 'Clerk user ID - owner of these settings';
