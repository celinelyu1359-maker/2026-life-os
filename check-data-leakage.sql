-- =========================================
-- 🔍 检查是否有数据泄漏痕迹
-- =========================================
-- 在 Supabase SQL Editor 运行
-- =========================================

-- 1. 检查所有注册用户（确认有多少用户）
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN last_sign_in_at > NOW() - INTERVAL '24 hours' THEN '🟢 活跃'
        WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN '🟡 最近活跃'
        ELSE '⚪ 不活跃'
    END AS status
FROM auth.users
ORDER BY created_at DESC;

-- 2. 检查每个用户的数据量
SELECT 
    u.email,
    COUNT(DISTINCT mg.id) AS monthly_goals_records,
    COUNT(DISTINCT dd.id) AS dashboard_records,
    COUNT(DISTINCT a_s.id) AS annual_settings_records
FROM auth.users u
LEFT JOIN monthly_goals mg ON u.id = mg.user_id
LEFT JOIN dashboard_data dd ON u.id = dd.user_id
LEFT JOIN annual_settings a_s ON u.id = a_s.user_id
GROUP BY u.id, u.email
ORDER BY u.created_at;

-- 3. 检查是否有跨用户访问的痕迹
-- （通过检查 updated_at 时间是否异常）
SELECT 
    mg.user_id,
    u.email,
    mg.month_index,
    jsonb_array_length(mg.goals) AS goal_count,
    mg.theme,
    mg.created_at,
    mg.updated_at,
    CASE 
        WHEN mg.updated_at > mg.created_at + INTERVAL '1 day' THEN '⚠️ 有修改'
        ELSE '✅ 未修改'
    END AS modification_status
FROM monthly_goals mg
JOIN auth.users u ON mg.user_id = u.id
ORDER BY mg.updated_at DESC;

-- 4. 检查 RLS 现在是否正常工作
-- （这个查询应该只返回当前登录用户的数据）
SELECT 
    COUNT(*) AS "你能看到的记录数",
    COUNT(DISTINCT user_id) AS "属于多少个用户",
    CASE 
        WHEN COUNT(DISTINCT user_id) = 1 THEN '✅ RLS 正常工作（只能看到自己的数据）'
        WHEN COUNT(DISTINCT user_id) > 1 THEN '❌ RLS 仍然有问题'
        ELSE 'ℹ️ 没有数据'
    END AS "RLS 状态"
FROM monthly_goals;

-- =========================================
-- 📊 结果解读
-- =========================================
-- 
-- 查询 1: 如果只有你自己的测试账号 → 无风险
-- 查询 2: 检查是否有用户数据量异常（比如突然增多）
-- 查询 3: 检查修改时间是否异常
-- 查询 4: 当前 RLS 是否生效
--
-- ⚠️ 如果查询 4 显示你能看到多个用户的数据
--    说明 fix-rls-security-enhanced.sql 还没运行成功
-- =========================================
