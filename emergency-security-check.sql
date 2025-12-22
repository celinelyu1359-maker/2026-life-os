-- =========================================
-- 🔴 紧急：立即运行此脚本确认 RLS 状态
-- =========================================

-- 1. 检查匿名权限（最关键！）
SELECT 
    '🔍 匿名权限检查' AS check_type,
    tablename,
    CASE 
        WHEN has_table_privilege('anon', 'public.' || tablename, 'SELECT') THEN '❌ EXPOSED: Anyone can read'
        ELSE '✅ SAFE: Anonymous blocked'
    END AS status,
    CASE 
        WHEN has_table_privilege('anon', 'public.' || tablename, 'SELECT') THEN '🚨 URGENT: Run fix-rls-security-enhanced.sql NOW'
        ELSE '✓ No action needed'
    END AS action
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies')
ORDER BY tablename;

-- 2. 统计真实用户数量
SELECT 
    '👥 User Statistics' AS info,
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') AS active_last_7_days,
    COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '30 days') AS active_last_30_days
FROM auth.users;

-- 3. 列出所有用户及其数据量（脱敏邮箱）
SELECT 
    LEFT(u.email, 3) || '***@' || SPLIT_PART(u.email, '@', 2) AS masked_email,
    u.created_at::date AS signup_date,
    u.last_sign_in_at::date AS last_login,
    COUNT(DISTINCT mg.id) AS monthly_goals,
    COUNT(DISTINCT dd.id) AS dashboard_weeks,
    COUNT(DISTINCT a_s.id) AS annual_settings
FROM auth.users u
LEFT JOIN monthly_goals mg ON u.id = mg.user_id
LEFT JOIN dashboard_data dd ON u.id = dd.user_id
LEFT JOIN annual_settings a_s ON u.id = a_s.user_id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at
ORDER BY u.created_at;

-- 4. 检查最近修改记录（寻找异常模式）
SELECT 
    '📝 Recent Modifications' AS info,
    DATE(updated_at) AS modification_date,
    COUNT(*) AS modifications,
    COUNT(DISTINCT user_id) AS affected_users
FROM (
    SELECT user_id, updated_at FROM monthly_goals
    UNION ALL
    SELECT user_id, updated_at FROM dashboard_data
    UNION ALL
    SELECT user_id, updated_at FROM annual_settings
) AS all_updates
WHERE updated_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(updated_at)
ORDER BY modification_date DESC;

-- 5. 测试当前用户的 RLS（只应看到自己的数据）
SELECT 
    '🔒 RLS Test (Current User View)' AS info,
    COUNT(*) AS records_visible,
    COUNT(DISTINCT user_id) AS unique_users,
    CASE 
        WHEN COUNT(DISTINCT user_id) = 0 THEN 'ℹ️ No data for current user'
        WHEN COUNT(DISTINCT user_id) = 1 THEN '✅ RLS WORKING: Only your data visible'
        WHEN COUNT(DISTINCT user_id) > 1 THEN '❌ RLS BROKEN: You can see ' || COUNT(DISTINCT user_id)::text || ' users data!'
        ELSE 'Unknown'
    END AS rls_status
FROM monthly_goals;

-- =========================================
-- 📊 结果判读指南
-- =========================================
--
-- 查询 1: 匿名权限检查
-- ❌ 如果有任何 "EXPOSED" → 立即运行 fix-rls-security-enhanced.sql
-- ✅ 如果全部 "SAFE" → RLS 已修复，继续查看其他结果
--
-- 查询 2: 用户统计
-- 记录有多少真实用户可能受影响
--
-- 查询 3: 用户数据量
-- 检查是否有账号数据量异常多（可能是攻击者批量获取）
--
-- 查询 4: 修改记录
-- 如果某天修改量特别大，可能是数据泄露时间点
--
-- 查询 5: RLS 测试
-- ❌ 如果能看到多个用户 → RLS 仍未生效
-- ✅ 只看到 1 个用户 → RLS 正常工作
--
-- =========================================
