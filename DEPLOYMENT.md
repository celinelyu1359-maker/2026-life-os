# 部署指南 - Vercel

## 📦 代码已推送到 GitHub

代码已成功推送到: `https://github.com/celinelyu1359-maker/2026-life-os.git`

---

## 🚀 Vercel 部署步骤

### 1. 检查 Vercel 自动部署

如果你的 GitHub 已经联动了 Vercel，代码推送后 Vercel 应该会自动触发部署。

**检查方法**:
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目 `2026-life-os`
3. 查看最新的部署状态

### 2. 配置环境变量（重要！）

在 Vercel 项目中添加以下环境变量：

#### 必需的环境变量

1. **VITE_SUPABASE_URL**
   - 值：你的 Supabase 项目 URL
   - 示例：`https://xxxxx.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - 值：你的 Supabase Anon Key
   - 示例：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 可选的环境变量

3. **GEMINI_API_KEY**（如果使用）
   - 值：你的 Gemini API Key

#### 在 Vercel 中添加环境变量的步骤：

1. 进入 Vercel Dashboard
2. 选择你的项目 `2026-life-os`
3. 点击 **Settings** → **Environment Variables**
4. 添加上述环境变量
5. 选择环境（Production, Preview, Development）
6. 点击 **Save**
7. **重要**: 重新部署项目（Redeploy）

### 3. 验证部署

部署完成后：

1. **检查构建日志**
   - 确保构建成功，没有错误

2. **测试应用**
   - 访问 Vercel 提供的 URL
   - 测试登录功能
   - 测试数据同步功能

3. **检查环境变量**
   - 确保环境变量已正确加载
   - 可以在浏览器控制台检查（不应该看到 Supabase 未配置的警告）

---

## 🔧 故障排除

### 问题 1: 构建失败

**可能原因**:
- 缺少依赖
- TypeScript 错误
- 构建命令错误

**解决方法**:
- 检查 Vercel 构建日志
- 确保 `package.json` 中的 `build` 脚本正确
- 本地运行 `npm run build` 测试

### 问题 2: 环境变量未生效

**可能原因**:
- 环境变量名称错误（必须是 `VITE_` 开头）
- 未重新部署

**解决方法**:
- 检查环境变量名称是否正确
- 在 Vercel Dashboard 中重新部署项目
- 清除浏览器缓存

### 问题 3: Supabase 连接失败

**可能原因**:
- 环境变量未设置
- CORS 配置问题

**解决方法**:
- 检查 Supabase Dashboard 中的 CORS 设置
- 确保 Vercel URL 已添加到 Supabase 允许的域名列表

---

## 📝 Vercel 配置说明

项目已包含 `vercel.json` 配置文件，包含：

- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **框架**: Vite
- **路由重写**: SPA 路由支持

---

## 🔄 自动部署

Vercel 会自动：
- ✅ 监听 `main` 分支的推送
- ✅ 自动触发构建和部署
- ✅ 为每个 Pull Request 创建预览部署

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel 构建日志
2. 检查环境变量配置
3. 查看浏览器控制台错误信息

