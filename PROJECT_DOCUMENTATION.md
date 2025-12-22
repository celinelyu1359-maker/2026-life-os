# 2026 Life OS - 项目文档 & 版本迭代记录

## 1. 项目愿景 (Project Vision)
**2026 Life OS** 是一个极简主义的个人生活管理系统，旨在帮助用户在 2026 年过上更有条理、更有趣的生活。它不仅仅是一个 Todo List，更是一个结合了**习惯养成**、**生活维度平衡**和**月度主题**的人生操作系统。

### 核心理念
- **Monthly Theme (月度主题)**: 每月设定一个核心主题，建立习惯或加速爱好。
- **Smart Todo (智能待办)**: 允许任务延期 (Delay)，减少未完成任务带来的焦虑。
- **Gamification (游戏化)**: 通过积分榜 (Scoreboard) 将习惯养成游戏化。
- **Data Privacy (数据隐私)**: 严格的数据隔离，支持访客模式。

---

## 2. 核心功能 (Core Features)

### 🏠 Dashboard (仪表盘)
- **Habit Scoreboard (习惯积分榜)**:
  - 设定每周习惯目标（如：阅读、运动、早起）。
  - 设定三个等级：Normal (及格), Silver (良好), Golden (优秀)。
  - **亮点功能**: 支持一键复制上周设置、重置本周数据、快速编辑。
- **Weekly Challenges (每周挑战)**: 记录本周的特别挑战。
- **Happy Hours (快乐时光)**: 记录本周的小确幸。
- **Weekly Insights (每周洞察)**: 基于规则引擎的智能反馈，根据你的表现给出鼓励或提醒。

### 🎯 Life Dimensions (生活维度 / Annual Settings)
- 设定年度/长期目标。
- 支持拆分目标、记录完成情况。
- 可视化追踪进度。
- **Motto (座右铭)**: 设定年度座右铭，时刻提醒自己。

### 📅 Monthly Notebook (月度手记)
- **Monthly Theme**: 设定本月主题。
- **Monthly Goals**: 管理月度目标，支持将未完成目标延期到下个月。
- **Notes**: 随手记录灵感、日记或周记。

### 📚 Reading & Movies (书影音)
- 记录看过的书和电影，保持精神世界的丰富。

### 🔐 Authentication & Security (认证与安全)
- **Supabase Auth**: 邮箱/密码登录，多端同步。
- **Guest Mode (访客模式)**: 无需注册即可体验全功能（数据保存在本地）。
- **Row Level Security (RLS)**: 银行级的数据隔离，确保用户只能看到自己的数据。

### 👋 Onboarding (新手引导)
- 首次进入时的交互式引导。
- **双语支持**: 完美支持中文和英文界面切换。

---

## 3. 技术架构 (Technical Architecture)

### 前端 (Frontend)
- **Framework**: React 19.2.0 + TypeScript 5.8.2
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS (原子化 CSS)
- **Icons**: Lucide React (统一 14px 极简风格)
- **Charts**: Recharts (数据可视化)

### 后端 & 数据库 (Backend & Database)
- **Platform**: Supabase (BaaS)
- **Database**: PostgreSQL
- **Security**:
  - **RLS (Row Level Security)**: 强制开启，每一行数据都绑定 `user_id`。
  - **Policies**: 严格的 SELECT/INSERT/UPDATE/DELETE 策略。
- **Storage**:
  - **Cloud**: Supabase Database (登录用户)。
  - **Local**: Browser LocalStorage (访客模式 & 缓存)。

### 关键文件结构
- `App.tsx`: 主入口，处理路由、认证状态、全局数据加载。
- `components/Dashboard.tsx`: 核心仪表盘逻辑。
- `components/OnboardingTour.tsx`: 新手引导组件。
- `insightEngine.ts`: 本地运行的洞察分析引擎。
- `supabase-schema.sql`: 数据库结构定义。

---

## 4. 版本迭代记录 (Version History)

### v1.5.0 - Guest Mode & Experience (Current)
- **Feat**: 新增 **Guest Mode (访客模式)**，允许不登录试用 Demo。
- **Feat**: 完善 **Onboarding Tour (新手引导)**，支持中英双语。
- **Fix**: 修复退出登录时的 "Auth session missing" 错误。
- **Docs**: 添加详细的项目文档。

### v1.4.0 - Security Hardening
- **Security**: 紧急修复数据隔离问题，实施 **RLS (Row Level Security)**。
- **Security**: 撤销匿名用户的表访问权限。
- **Feat**: 在数据库中添加 `motto` 字段，实现多端同步。
- **Refactor**: 移除全局 LocalStorage key，防止多用户数据串扰。

### v1.3.0 - Feature Expansion
- **Feat**: 实现 **Weekly Insights** 规则引擎 (10条黄金法则)。
- **Feat**: 添加 **Empty State (空状态)** 组件，提升初次使用体验。
- **UI**: 统一所有图标尺寸为 14px，优化字体显示 (Inter + Courier Prime)。
- **UI**: 优化 Scoreboard 的 Tooltip 交互 (复制/重置/编辑)。

### v1.2.0 - Data Sync
- **Feat**: 实现 Monthly Theme 和 Monthly Goals 的 Supabase 同步。
- **Feat**: 完善 Annual Settings 的数据持久化。

### v1.1.0 - UI Polish
- **UI**: 像素级 UI 调整，实现 "Pixel Perfect" 设计。
- **UI**: 优化移动端适配。

### v1.0.0 - Initialization
- **Init**: 项目初始化，搭建 React + Vite + Tailwind 架构。
- **Init**: 集成 Supabase 基础认证。

---

## 5. 如何开始 (Getting Started)

### 开发环境
1. 克隆仓库。
2. 安装依赖: `npm install`
3. 配置环境变量 `.env.local`:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. 启动开发服务器: `npm run dev`

### 部署
- 项目配置了 `vercel.json`，可直接部署至 Vercel。
- 构建命令: `npm run build`
