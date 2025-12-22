-- =========================================
-- 🎯 添加 Motto 字段到 annual_settings 表
-- =========================================
-- 在 Supabase SQL Editor 运行
-- =========================================

-- 1. 添加 motto 字段（如果不存在）
ALTER TABLE public.annual_settings 
ADD COLUMN IF NOT EXISTS motto TEXT;

-- 2. 验证字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'annual_settings'
AND column_name = 'motto';

-- 应该显示：
-- column_name | data_type | is_nullable
-- motto       | text      | YES
