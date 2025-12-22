# 🚨 紧急安全修复指南

## 问题描述

你的数据库**没有启用 Row Level Security (RLS)**，导致：
- ✅ 代码层面有 `user_id` 过滤（好的）
- ❌ 数据库层面没有权限控制（严重安全漏洞）
- 结果：任何用户都能通过直接数据库查询看到其他人的数据

## 立即修复步骤

### 1️⃣ 打开 Supabase 控制台
访问: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

### 2️⃣ 运行修复脚本
1. 点击左侧 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴 `fix-rls-security.sql` 的全部内容
4. 点击 **Run** 执行

### 3️⃣ 验证修复
运行以下查询确认 RLS 已启用：

```sql
-- 应该返回 4 行，rowsecurity 都为 true
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies');
```

### 4️⃣ 测试数据隔离
1. 登出当前账号
2. 用另一个账号登录
3. 确认只能看到该账号的数据，看不到其他账号的数据

## 原理解释

### Row Level Security (RLS) 是什么？
这是 PostgreSQL 数据库的安全功能，确保：
- 用户 A 登录 → 只能查询/修改 `user_id = A` 的行
- 用户 B 登录 → 只能查询/修改 `user_id = B` 的行
- 即使有人绕过前端代码，也无法访问他人数据

### 为什么会出现这个问题？
你可能只运行了建表语句：
```sql
CREATE TABLE dashboard_data (...);  -- ✅ 执行了
```

但没有运行 RLS 策略：
```sql
ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;  -- ❌ 没执行
CREATE POLICY ...  -- ❌ 没执行
```

## 数据安全现状

### 当前代码层面（已经做对的）✅
- App.tsx: `.eq('user_id', user.id)` 
- Dashboard.tsx: `.eq('user_id', user.id)`
- 所有查询都有 user_id 过滤

### 数据库层面（需要修复）❌
- 没有 RLS 策略 = 绕过代码可以访问任意数据
- 例如：直接在 Supabase Dashboard 执行 `SELECT * FROM dashboard_data` 会返回所有用户的数据

## 修复后的效果

### Before (不安全) ❌
```javascript
// 恶意用户可以修改 user_id
supabase.from('dashboard_data').select('*').eq('user_id', '别人的ID')
// 返回：其他人的数据 😱
```

### After (安全) ✅
```javascript
// 即使改代码，数据库也会拦截
supabase.from('dashboard_data').select('*').eq('user_id', '别人的ID')
// 返回：[] (RLS 策略自动过滤) 🔒
```

## 检查清单

- [ ] 运行 `fix-rls-security.sql`
- [ ] 验证所有表的 `rowsecurity = true`
- [ ] 验证每个表有 4 条策略（SELECT, INSERT, UPDATE, DELETE）
- [ ] 多账号测试：切换账号后数据隔离
- [ ] 删除 `fix-rls-security.sql`（已修复后不再需要）

## 如何避免类似问题

**标准流程：**
1. 创建新表时，同时创建 RLS 策略
2. 在 Supabase Dashboard → Authentication → Policies 里检查策略
3. 测试：用两个不同账号登录，确认数据隔离

**快捷检查：**
```sql
-- 快速查看所有表的 RLS 状态
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

## 相关文档

- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 原理](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
