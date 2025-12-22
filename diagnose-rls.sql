-- =========================================
-- 🔍 RLS 诊断脚本
-- =========================================
-- 在 Supabase SQL Editor 运行这个脚本来诊断 RLS 问题
-- =========================================

-- 1. 检查所有表的 RLS 状态
-- =========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ DISABLED - SECURITY RISK!'
    END AS "Status"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies')
ORDER BY tablename;

-- 2. 检查 monthly_goals 表的所有策略
-- =========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd AS "Operation",
    CASE 
        WHEN cmd = 'SELECT' THEN '📖 Read'
        WHEN cmd = 'INSERT' THEN '➕ Create'
        WHEN cmd = 'UPDATE' THEN '✏️ Update'
        WHEN cmd = 'DELETE' THEN '🗑️ Delete'
        ELSE cmd
    END AS "Type",
    qual AS "USING condition",
    with_check AS "WITH CHECK condition"
FROM pg_policies
WHERE tablename = 'monthly_goals'
ORDER BY cmd;

-- 3. 统计 monthly_goals 表的数据（按用户分组）
-- =========================================
-- ⚠️ 注意：如果 RLS 正常工作，这个查询只会显示当前登录用户的数据
SELECT 
    user_id,
    COUNT(*) AS "Total Records",
    COUNT(DISTINCT month_index) AS "Months with Data",
    MIN(month_index) AS "First Month",
    MAX(month_index) AS "Last Month"
FROM monthly_goals
WHERE year = 2026
GROUP BY user_id
ORDER BY user_id;

-- 4. 查看当前用户可以访问的数据
-- =========================================
-- ⚠️ 如果 RLS 工作正常，应该只返回当前用户的数据
SELECT 
    id,
    user_id,
    month_index,
    year,
    CASE 
        WHEN jsonb_array_length(goals) > 0 THEN '✅ Has Goals'
        ELSE '⚪ Empty'
    END AS "Goals Status",
    CASE 
        WHEN theme IS NOT NULL THEN '✅ Has Theme'
        ELSE '⚪ No Theme'
    END AS "Theme Status",
    created_at
FROM monthly_goals
WHERE year = 2026
ORDER BY month_index;

-- 5. 检查是否有孤立策略（策略名存在但没有关联到表）
-- =========================================
SELECT 
    policyname,
    'monthly_goals' AS expected_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.policyname = pg_policies.policyname 
            AND p.tablename = 'monthly_goals'
        ) THEN '✅ Active'
        ELSE '❌ Orphaned'
    END AS status
FROM pg_policies
WHERE policyname LIKE '%monthly%'
GROUP BY policyname;

-- =========================================
-- 🔧 预期结果（如果 RLS 正常工作）
-- =========================================
-- 
-- 查询 1：所有表的 RLS Enabled = true
-- 查询 2：应该有 4 条策略（SELECT, INSERT, UPDATE, DELETE）
-- 查询 3：只显示 1 个 user_id（当前登录用户）
-- 查询 4：只显示当前用户的数据
-- 查询 5：所有策略 status = Active
--
-- ❌ 如果查询 3 显示多个 user_id，说明 RLS 没生效！
-- =========================================

-- 6. 测试 RLS 是否真的在工作（高级诊断）
-- =========================================
-- 显示当前认证用户
SELECT 
    auth.uid() AS "Current User ID",
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ Not authenticated (RLS will block ALL access)'
        ELSE '✅ Authenticated'
    END AS "Auth Status";

-- 7. 检查表的所有者和权限
-- =========================================
SELECT 
    schemaname,
    tablename,
    tableowner,
    CASE 
        WHEN has_table_privilege('anon', schemaname || '.' || tablename, 'SELECT') THEN '⚠️ Anonymous can read'
        ELSE '✅ Anonymous blocked'
    END AS "Anonymous Access",
    CASE 
        WHEN has_table_privilege('authenticated', schemaname || '.' || tablename, 'SELECT') THEN '✅ Authenticated can read (via RLS)'
        ELSE '❌ Authenticated blocked'
    END AS "Authenticated Access"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'monthly_goals';
