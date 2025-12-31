-- =============================================
-- 清理 annual_settings 表中的重复记录
-- 在 Supabase SQL Editor 中运行
-- =============================================

-- 1. 查看当前有哪些重复的 (user_id, year) 组合
SELECT 
    user_id, 
    year, 
    COUNT(*) as duplicate_count,
    array_agg(id) as all_ids,
    array_agg(created_at) as all_created_at
FROM public.annual_settings
GROUP BY user_id, year
HAVING COUNT(*) > 1;

-- 2. 删除重复记录，只保留最新的一条
-- 这个查询会为每个 (user_id, year) 组合保留 created_at 最新的记录
DELETE FROM public.annual_settings
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, year 
                ORDER BY created_at DESC
            ) as rn
        FROM public.annual_settings
    ) t
    WHERE rn > 1
);

-- 3. 验证清理结果（应该没有重复了）
SELECT 
    user_id, 
    year, 
    COUNT(*) as count
FROM public.annual_settings
GROUP BY user_id, year
HAVING COUNT(*) > 1;

-- 4. 查看清理后的数据
SELECT 
    id,
    user_id,
    year,
    created_at,
    updated_at
FROM public.annual_settings
ORDER BY created_at DESC;
