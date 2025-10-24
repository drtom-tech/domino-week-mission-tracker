-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text OR auth.uid()::text = clerk_user_id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id::text OR auth.uid()::text = clerk_user_id);

-- Tasks table policies
-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Settings table policies
-- Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON public.settings
  FOR SELECT
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON public.settings
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON public.settings
  FOR UPDATE
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON public.settings
  FOR DELETE
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = clerk_user_id);
