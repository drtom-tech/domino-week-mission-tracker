-- Disable Row Level Security to allow access to tables
-- This is for development/preview purposes
-- In production, you should enable RLS and add proper policies

-- Disable RLS on tasks table
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table if it exists
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on settings table if it exists
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
