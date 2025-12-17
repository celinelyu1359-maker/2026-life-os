-- =======================================================
-- 修复 notes 表：添加所有缺失的列
-- =======================================================
-- 如果你的 notes 表已经存在但缺少某些列，运行这个 SQL
-- 这个脚本会检查并添加所有必需的列：date 和 type
-- =======================================================

-- 检查并添加 date 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notes' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE public.notes ADD COLUMN date date;
        
        -- 如果有旧数据，将 created_at 的日期部分复制到 date 列
        UPDATE public.notes 
        SET date = created_at::date 
        WHERE date IS NULL;
        
        RAISE NOTICE '✅ Added date column to notes table';
    ELSE
        RAISE NOTICE 'ℹ️ date column already exists in notes table';
    END IF;
END $$;

-- 检查并添加 type 列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notes' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.notes ADD COLUMN type text DEFAULT 'note';
        
        -- 如果有旧数据，设置默认值
        UPDATE public.notes 
        SET type = 'note' 
        WHERE type IS NULL;
        
        RAISE NOTICE '✅ Added type column to notes table';
    ELSE
        RAISE NOTICE 'ℹ️ type column already exists in notes table';
    END IF;
END $$;

-- 确保所有必需的列都存在
DO $$
DECLARE
    missing_columns text[];
BEGIN
    SELECT array_agg(required_col)
    INTO missing_columns
    FROM (
        SELECT unnest(ARRAY['id', 'user_id', 'title', 'content', 'date', 'type', 'created_at', 'updated_at']) as required_col
    ) req
    WHERE NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notes' 
        AND column_name = req.required_col
    );
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING '⚠️ Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist';
    END IF;
END $$;

-- 验证表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'notes'
ORDER BY ordinal_position;

-- 显示表结构摘要
SELECT 
    'notes 表结构验证完成' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name IN ('id', 'user_id', 'title', 'content', 'date', 'type', 'created_at', 'updated_at') THEN 1 END) as required_columns_found
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'notes';

