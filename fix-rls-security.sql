-- =======================================================
-- 🔒 CRITICAL SECURITY FIX: Enable Row Level Security
-- =======================================================
-- ⚠️ RUN THIS IMMEDIATELY IN SUPABASE SQL EDITOR ⚠️
-- 
-- This script fixes the data leakage issue where users can see
-- other users' data due to missing RLS policies.
-- =======================================================

-- 1. Enable RLS on all tables (if not already enabled)
-- =======================================================
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_movies ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) to avoid conflicts
-- =======================================================
DROP POLICY IF EXISTS "Users can read own dashboard data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Users can insert own dashboard data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Users can update own dashboard data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Users can delete own dashboard data" ON public.dashboard_data;

DROP POLICY IF EXISTS "Users can read own monthly goals" ON public.monthly_goals;
DROP POLICY IF EXISTS "Users can insert own monthly goals" ON public.monthly_goals;
DROP POLICY IF EXISTS "Users can update own monthly goals" ON public.monthly_goals;
DROP POLICY IF EXISTS "Users can delete own monthly goals" ON public.monthly_goals;

DROP POLICY IF EXISTS "Users can read own annual settings" ON public.annual_settings;
DROP POLICY IF EXISTS "Users can insert own annual settings" ON public.annual_settings;
DROP POLICY IF EXISTS "Users can update own annual settings" ON public.annual_settings;
DROP POLICY IF EXISTS "Users can delete own annual settings" ON public.annual_settings;

DROP POLICY IF EXISTS "Users can read own reading movies" ON public.reading_movies;
DROP POLICY IF EXISTS "Users can insert own reading movies" ON public.reading_movies;
DROP POLICY IF EXISTS "Users can update own reading movies" ON public.reading_movies;
DROP POLICY IF EXISTS "Users can delete own reading movies" ON public.reading_movies;

-- 3. Create RLS Policies for dashboard_data
-- =======================================================
CREATE POLICY "Users can read own dashboard data"
ON public.dashboard_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard data"
ON public.dashboard_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard data"
ON public.dashboard_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard data"
ON public.dashboard_data FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create RLS Policies for monthly_goals
-- =======================================================
CREATE POLICY "Users can read own monthly goals"
ON public.monthly_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly goals"
ON public.monthly_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly goals"
ON public.monthly_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly goals"
ON public.monthly_goals FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create RLS Policies for annual_settings
-- =======================================================
CREATE POLICY "Users can read own annual settings"
ON public.annual_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annual settings"
ON public.annual_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annual settings"
ON public.annual_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annual settings"
ON public.annual_settings FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create RLS Policies for reading_movies
-- =======================================================
CREATE POLICY "Users can read own reading movies"
ON public.reading_movies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading movies"
ON public.reading_movies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading movies"
ON public.reading_movies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading movies"
ON public.reading_movies FOR DELETE
USING (auth.uid() = user_id);

-- =======================================================
-- ✅ Verification Queries
-- =======================================================
-- Run these to verify RLS is working:

-- Check if RLS is enabled (should return true for all tables)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies');

-- List all policies (should show 4 policies per table)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies')
ORDER BY tablename, cmd;

-- Test query (should only return current user's data)
-- SELECT * FROM dashboard_data;
-- SELECT * FROM monthly_goals;
