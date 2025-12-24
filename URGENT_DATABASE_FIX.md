# 🚨 紧急数据库修复指南

## 问题描述
Annual Settings 保存失败，错误信息：
```
Could not find the 'motto' column of 'annual_settings' in the schema cache
```

## 根本原因
你的 Supabase 数据库中 `annual_settings` 表**缺少 `motto` 列**。

## 解决方案

### 方案 1: 在 Supabase SQL Editor 中运行 (推荐)

1. 打开 Supabase Dashboard → SQL Editor
2. 复制粘贴以下 SQL 命令：

```sql
-- 添加 motto 字段到 annual_settings 表
ALTER TABLE public.annual_settings 
ADD COLUMN IF NOT EXISTS motto TEXT;
```

3. 点击 "Run" 执行
4. 刷新你的应用页面，问题解决！

### 方案 2: 使用已有的迁移文件

在 Supabase SQL Editor 中运行 `add-motto-field.sql` 文件的内容。

## 验证修复

运行以下 SQL 验证 motto 列已添加：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'annual_settings'
AND column_name = 'motto';
```

应该显示：
```
column_name | data_type | is_nullable
motto       | text      | YES
```

## 代码已修复

我已经更新了代码：
1. ✅ `supabase-schema.sql` 现在包含 `motto text` 列定义
2. ✅ `AnnualSettings.tsx` 现在只在 motto 有值时才发送到数据库（向后兼容）

即使你没有立即运行上述 SQL，应用也不会再崩溃，只是 motto 功能暂时不会同步到云端。
