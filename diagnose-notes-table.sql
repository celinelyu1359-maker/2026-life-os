-- =======================================================
-- 诊断 notes 表配置
-- =======================================================
-- 运行这个 SQL 来检查 notes 表的配置是否正确
-- =======================================================

-- 1. 检查表是否存在
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes')
        THEN '✅ notes 表存在'
        ELSE '❌ notes 表不存在'
    END as table_status;

-- 2. 检查所有列
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'notes'
ORDER BY ordinal_position;

-- 3. 检查 RLS 是否启用
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'notes' 
            AND rowsecurity = true
        )
        THEN '✅ RLS 已启用'
        ELSE '❌ RLS 未启用'
    END as rls_status;

-- 4. 检查 RLS Policies
SELECT 
    policyname as policy_name,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'notes'
ORDER BY policyname;

-- 5. 检查索引
SELECT 
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'notes';

-- 6. 检查示例数据（如果有）
SELECT 
    COUNT(*) as total_notes,
    COUNT(DISTINCT user_id) as unique_users
FROM public.notes;

-- 7. 显示最近的几条笔记（如果有）
SELECT 
    id,
    user_id,
    title,
    LEFT(content, 50) as content_preview,
    date,
    type,
    created_at
FROM public.notes
ORDER BY created_at DESC
LIMIT 5;

