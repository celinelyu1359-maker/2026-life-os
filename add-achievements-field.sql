-- =========================================
-- 🎯 添加 Achievements 字段到 annual_settings 表
-- =========================================
-- 在 Supabase SQL Editor 运行
-- =========================================

-- 1. 添加 achievements 字段（如果不存在）
ALTER TABLE public.annual_settings 
ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb;

-- 2. 验证字段已添加
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'annual_settings'
AND column_name = 'achievements';

-- 应该显示：
-- column_name  | data_type | column_default
-- achievements | jsonb     | '[]'::jsonb
