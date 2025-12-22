-- =======================================================
-- 🔒 增强版 RLS 安全修复（修复匿名访问问题）
-- =======================================================
-- ⚠️ 立即在 Supabase SQL Editor 运行 ⚠️
-- 
-- 问题：匿名用户可以读取 monthly_goals 表
-- 原因：Supabase 默认给 anon 角色授予了 SELECT 权限
-- 解决：撤销 anon 权限 + 强化 RLS 策略
-- =======================================================

-- 1. 撤销匿名用户对所有表的访问权限
-- =======================================================
REVOKE ALL ON public.dashboard_data FROM anon;
REVOKE ALL ON public.monthly_goals FROM anon;
REVOKE ALL ON public.annual_settings FROM anon;
REVOKE ALL ON public.reading_movies FROM anon;

-- 2. 确保只有已认证用户可以访问
-- =======================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboard_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annual_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_movies TO authenticated;

-- 3. 确保 RLS 已启用
-- =======================================================
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_movies ENABLE ROW LEVEL SECURITY;

-- 4. 强制 RLS（即使是表的所有者也要遵守 RLS）
-- =======================================================
ALTER TABLE public.dashboard_data FORCE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.annual_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reading_movies FORCE ROW LEVEL SECURITY;

-- 5. 删除旧策略（避免冲突）
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

-- 6. 创建增强版 RLS 策略（只允许已认证用户访问自己的数据）
-- =======================================================

-- dashboard_data 策略
CREATE POLICY "Authenticated users can read own dashboard data"
ON public.dashboard_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own dashboard data"
ON public.dashboard_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own dashboard data"
ON public.dashboard_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own dashboard data"
ON public.dashboard_data FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- monthly_goals 策略
CREATE POLICY "Authenticated users can read own monthly goals"
ON public.monthly_goals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own monthly goals"
ON public.monthly_goals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own monthly goals"
ON public.monthly_goals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own monthly goals"
ON public.monthly_goals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- annual_settings 策略
CREATE POLICY "Authenticated users can read own annual settings"
ON public.annual_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own annual settings"
ON public.annual_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own annual settings"
ON public.annual_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own annual settings"
ON public.annual_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- reading_movies 策略
CREATE POLICY "Authenticated users can read own reading movies"
ON public.reading_movies FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own reading movies"
ON public.reading_movies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own reading movies"
ON public.reading_movies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own reading movies"
ON public.reading_movies FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =======================================================
-- ✅ 验证修复
-- =======================================================

-- 检查匿名权限（应该全部显示 "Blocked"）
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN has_table_privilege('anon', schemaname || '.' || tablename, 'SELECT') THEN '❌ Anonymous can read'
        ELSE '✅ Anonymous blocked'
    END AS "Anonymous Access"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies');

-- 检查 RLS 状态（应该全部为 true + FORCE）
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ RLS ON'
        ELSE '❌ RLS OFF'
    END AS "Status"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies');

-- 检查策略数量（每个表应该有 4 条策略）
SELECT 
    tablename,
    COUNT(*) AS "Policy Count",
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ Complete'
        ELSE '⚠️ Missing policies'
    END AS "Status"
FROM pg_policies
WHERE tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies')
GROUP BY tablename
ORDER BY tablename;
