# 🚨 数据泄露事件响应计划

## 当前状况评估

**风险等级：中高 ⚠️**

### 暴露事实
- ✅ `.env` 文件未提交到 git 历史
- ❌ GitHub 仓库是 Public
- ❌ 有真实用户注册
- ❌ Vercel 部署后，前端 JS 包含 Supabase credentials

### 攻击面分析

**任何访问你网站的人都可以：**
1. 打开浏览器开发者工具（F12）
2. 在 Network 或 Sources 里找到编译后的 JS
3. 搜索 "supabase" 提取 URL 和 anon key
4. 使用这些 credentials 直接调用 Supabase API

**在 RLS 修复前（今天之前）：**
```javascript
// 任何人都可以这样做：
const supabase = createClient(
  '你的_SUPABASE_URL',  // 从前端代码提取
  '你的_ANON_KEY'       // 从前端代码提取
);

// 无需登录，直接读取所有数据
const { data } = await supabase.from('monthly_goals').select('*');
// 返回：所有用户的数据 😱
```

---

## 🔴 立即执行（紧急）

### 1. 确认 RLS 已修复 ✅ 最高优先级

在 Supabase SQL Editor 运行：
```sql
-- 如果返回所有 "✅ Anonymous blocked"，说明已安全
SELECT 
    tablename,
    CASE 
        WHEN has_table_privilege('anon', 'public.' || tablename, 'SELECT') 
        THEN '❌ Anonymous can read' 
        ELSE '✅ Anonymous blocked'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('dashboard_data', 'monthly_goals', 'annual_settings', 'reading_movies');
```

**如果有 ❌，立即运行：**
```bash
fix-rls-security-enhanced.sql 的全部内容
```

---

### 2. 审计数据访问 🔍

运行 `check-data-leakage.sql` 查看：
- 有多少个真实用户
- 数据修改时间是否异常
- 是否有可疑的访问模式

---

### 3. 考虑是否重置 Supabase Credentials ⚠️

**为什么需要：**
- 即使 RLS 现在修复了，旧的 anon key 仍在野外流传
- 任何提取过你 credentials 的人可能保存了它们

**如何重置（Supabase Dashboard）：**
1. Settings → API → Project API keys
2. 点击 "Reset anon key"
3. 更新你的 `.env.local` 文件
4. 重新部署到 Vercel

**代价：**
- 旧的 App 版本会失效
- 用户需要刷新页面

---

## 📧 用户通知建议

### 情况 A: RLS 已修复 + 无异常访问

**发送给用户：**
```
Hi，

我们最近升级了安全系统，请在下次使用时：
1. 清除浏览器缓存并刷新页面
2. 如有任何异常，请联系我们

感谢你的理解！
```

### 情况 B: 发现可疑访问

**发送给用户：**
```
重要安全通知

我们发现了一个安全配置问题，已紧急修复。
作为预防措施，建议你：

1. 检查你的数据是否有异常修改
2. 如果你的目标/笔记中有敏感信息，请考虑修改
3. 我们已加强了数据隔离措施

对此给你带来的不便深表歉意。
数据安全是我们的首要任务。

如有疑问，请随时联系。
```

---

## 📊 数据泄露影响评估

### 可能被访问的数据类型

| 数据类型 | 敏感度 | 影响 |
|---------|--------|------|
| Weekly Goals (睡眠、运动记录) | 低 | 个人习惯，无身份信息 |
| Monthly Goals | 低 | 月度计划，无直接身份 |
| Challenges | 低 | 个人目标，无敏感内容 |
| Happy Hours | 中 | 可能包含社交信息 |
| Life Dimensions | 中 | 个人价值观，相对私密 |
| 20 To Do | 中 | 可能包含具体计划 |
| Reading & Movies | 低 | 娱乐偏好 |
| Email (存在 auth.users) | **高** | 如果被访问，可识别用户 |

### 最坏情况评估

**如果有人恶意访问：**
- ❌ 可以看到所有用户的目标、习惯、笔记
- ❌ 可以看到 email（如果查询 auth.users）
- ✅ 看不到密码（Supabase 加密）
- ✅ 看不到真实姓名（你的表里没有）
- ✅ 看不到支付信息（没有收费功能）

**实际可能性：**
- 🟢 随机访客：极低（需要懂技术 + 有恶意）
- 🟡 好奇的技术用户：低-中（可能无意中发现）
- 🔴 针对性攻击：极低（你的 App 不是高价值目标）

---

## 🛡️ 长期防护措施

### 1. 立即执行
- [x] 运行 `fix-rls-security-enhanced.sql`
- [ ] 运行 `check-data-leakage.sql` 审计
- [ ] 决定是否重置 anon key
- [ ] 清理所有用户的旧 localStorage（发布更新）

### 2. 本周内完成
- [ ] 添加 Rate Limiting（防止暴力查询）
- [ ] 启用 Supabase Audit Logs（跟踪异常访问）
- [ ] 考虑添加 Service Role Key 用于管理操作

### 3. 未来改进
- [ ] 实现 Database Webhooks（监控可疑活动）
- [ ] 添加用户活动日志（记录登录、修改）
- [ ] 考虑端到端加密（敏感笔记）

---

## ✅ 执行清单

**现在立即：**
1. [ ] 在 Supabase 运行匿名权限检查
2. [ ] 如果有问题，运行 `fix-rls-security-enhanced.sql`
3. [ ] 运行 `check-data-leakage.sql` 查看用户数据

**今天内：**
4. [ ] 分析审计结果
5. [ ] 决定是否重置 anon key
6. [ ] 准备用户通知（如有必要）

**明天：**
7. [ ] 添加安全监控
8. [ ] 更新文档，记录事件教训

---

## 🧠 经验教训

**为什么会发生：**
1. ⚠️ Supabase 默认配置太宽松（给 anon 角色权限）
2. ⚠️ RLS 策略写了，但没验证是否真正生效
3. ⚠️ 没有在上线前做跨账号测试

**下次如何避免：**
1. ✅ 上线前必须运行 RLS 验证脚本
2. ✅ 用两个测试账号模拟攻击
3. ✅ 定期审计数据库权限
4. ✅ 启用 Supabase 安全通知

---

请立即运行检查脚本，然后告诉我结果，我帮你评估具体影响！
