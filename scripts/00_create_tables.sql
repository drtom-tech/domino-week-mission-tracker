-- Create tables for the Mission and Door app
-- This script sets up the complete database schema

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  email_verified TIMESTAMP,
  image TEXT,
  clerk_user_id TEXT UNIQUE
);

-- Create tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  column_name VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  week_start_date DATE NOT NULL,
  parent_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  is_expanded BOOLEAN DEFAULT false,
  is_moved_to_hitlist BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT,
  openai_api_key TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_clerk_user_id ON tasks(clerk_user_id);
CREATE INDEX idx_tasks_column_name ON tasks(column_name);
CREATE INDEX idx_tasks_week_start_date ON tasks(week_start_date);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_clerk_user_id ON settings(clerk_user_id);

-- Disable Row Level Security (RLS) for easier development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON tasks TO anon, authenticated;
GRANT ALL ON settings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
