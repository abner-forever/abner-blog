# 聊天移动端设置体系

> **状态**: 已归档 — 被 [V2（全屏页面 + 拖拽半弹窗）](mobile-settings-iteration-2.md) 取代
> 保留此文档以供 V2 引用，不再更新。

## 概述

本规范定义 AI 聊天应用（apps/chat）的移动端设置体系重构方案，解决当前「ChatHeader 右上角设置按钮在移动端无法点击退出、ChatHistoryDrawer 底部为功能 Toggle 而非用户中心、设置弹窗（ChatSettingsModal）为桌面式普通 Modal 而非移动端底部弹窗」等问题。

设计目标：
- **移动端**：抽屉底部展示用户信息 → 点击拉起底部设置弹窗 → 子设置以堆叠弹窗或全屏页面展示
- **桌面端**：保留现有交互（左下角头像下拉菜单 → ChatSettingsModal），仅移除 Header 设置按钮、新增数据管理 Tab
- **导航体验**：知识库/MCP/技能使用独立路由页面 + KeepAlive 页面缓存 + iOS 式转场动画

## 决策记录

| # | 决策 | 结论 |
|---|------|------|
| D1 | 桌面端策略 | 保留现有交互，仅移除 ChatHeader 右上角 `SettingOutlined` 按钮 |
| D2 | 移动端设置入口 | 去掉 ChatHistoryDrawer 底部知识库/MCP/技能 Toggle 按钮，替换为用户信息+设置入口 |
| D3 | 菜单项 | 账号管理、模型设置、外观设置、数据管理、知识库、MCP、技能、关于、退出登录（按此顺序） |
| D4 | 知识库/MCP/技能交互 | 使用全屏路由页面（非弹窗），点击导航到独立页面 |
| D5 | 数据管理 | 桌面端 ChatSettingsModal 新增「数据」Tab；移动端为子级底部弹窗 |
| D6 | 退出登录 | 移动端弹出确认底部弹窗（二次确认）；桌面端保持现有 Popconfirm |
| D7 | 关于 | 作为菜单项，显示在退出登录之上 |
| D8 | 子级弹窗模式 | 栈式堆叠：主菜单在上，子弹窗滑入覆盖（参考 DeepSeek） |
| D9 | 子级弹窗内容 | 账号管理/模型设置/外观设置/数据管理/关于 → 子底部弹窗 |
| D10 | 页面缓存 | `<KeepAlive>` 组件（display:none/block 模式），路由切换不卸载聊天页 DOM |
| D11 | 转场动画 | 使用 `framer-motion`（需新增依赖），实现 iOS 式页面滑入滑出 |
| D12 | 路由路径 | `/chat` 首页 → `/chat/settings/knowledge-base` / `mcp` / `skills` |

## 路由架构

### 新增路由

```typescript
// apps/chat/src/App.tsx
<Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
<Route path="/chat/settings/knowledge-base" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
<Route path="/chat/settings/mcp" element={<ProtectedRoute><MCPSettingsPage /></ProtectedRoute>} />
<Route path="/chat/settings/skills" element={<ProtectedRoute><SkillSettingsPage /></ProtectedRoute>} />
```

### 路由容器结构

```
App (BrowserRouter)
├── KeepAlive (always mounted, display:none when on settings)
│   └── Routes
│       └── /chat → ChatPage
├── AnimatePresence (page transition animations)
│   └── Routes (location.key based)
│       ├── /chat/settings/knowledge-base → KnowledgeBasePage
│       ├── /chat/settings/mcp → MCPSettingsPage
│       └── /chat/settings/skills → SkillSettingsPage
```

关键设计：`KeepAlive` 包裹 `/chat` 路由，使其在导航到设置页面时 DOM 保持挂载（`display:none` 隐藏），聊天状态（输入内容、消息列表、滚动位置）自然保留。

## 组件树

### 移动端组件层级

```
ChatHistoryDrawer
├── drawer-header (聊天历史 + 新建对话)
├── drawer-list (会话列表)
└── drawer-footer [新增：替换 Toggle 按钮]
    └── UserInfoBar
        ├── Avatar (用户头像)
        ├── UserName (用户名)
        └── RightArrow (右箭头)
        └── onClick → SET_MOBILE_SETTINGS_OPEN(true)

MobileSettingsSheet [新增：底部拉起半弹窗]
├── sheet-header (设置 / 拖拽条)
├── sheet-body
│   ├── MenuItem: 账号管理     → AccountSubSheet (子弹窗)
│   ├── MenuItem: 模型设置     → ModelSubSheet (子弹窗)
│   ├── MenuItem: 外观设置     → AppearanceSubSheet (子弹窗)
│   ├── MenuItem: 数据管理     → DataSubSheet (子弹窗)
│   ├── MenuItem: 知识库       → router.navigate('/chat/settings/knowledge-base')
│   ├── MenuItem: MCP          → router.navigate('/chat/settings/mcp')
│   ├── MenuItem: 技能         → router.navigate('/chat/settings/skills')
│   ├── MenuItem: 关于         → AboutSubSheet (子弹窗)
│   └── MenuItem: 退出登录     → LogoutConfirmSheet (确认子弹窗)
└── sheet-footer (可选)
```

### 子级弹窗（栈式堆叠）

每个子弹窗组件接收统一的 Props 接口：

```typescript
interface SubSheetProps {
  visible: boolean;
  onClose: () => void;
}
```

子弹窗列表：

| 组件 | 内容 | 深度 |
|------|------|------|
| AccountSubSheet | 头像上传、昵称编辑、简介编辑 | 1 层表单 |
| ModelSubSheet | 供应商选择、模型选择、API Key（遮罩）、Temperature 滑块、MaxTokens、Thinking 开关+Budget | 1 层表单 |
| AppearanceSubSheet | 主题（深/浅/系统）、语言（中/繁/英）、皮肤（16色分类） | 1 层单选 |
| DataSubSheet | 导入聊天记录、导出聊天记录、清除所有记录（带确认） | 1 层操作按钮 |
| AboutSubSheet | 当前模型、系统版本、版权信息 | 纯展示 |
| LogoutConfirmSheet | 确认退出登录 + 取消按钮 | 确认操作 |

### 知识库/MCP/技能页面

复用现有 Panel 组件，包装为全屏布局：

```typescript
// KnowledgeBasePage.tsx
// 复用 KnowledgeBasePanel，注入 onClose = () => navigate(-1)
// 头部增加返回按钮替代原有 close 按钮

// MCPSettingsPage.tsx
// 复用 MCPServerPanel，同样包装

// SkillSettingsPage.tsx
// 复用 SkillPanel，同样包装
```

每个页面组件结构：

```
PageLayout
├── page-header
│   ├── BackArrow (← 返回按钮)
│   └── Title (页面标题)
└── page-content
    └── [Reused Panel Component] (KnowledgeBasePanel / MCPServerPanel / SkillPanel)
```

## 交互流程

### 移动端设置弹窗交互

```
┌─────────────────────────────────────┐
│  用户打开 ChatHistoryDrawer          │
│  (点击汉堡菜单按钮)                   │
└──────────┬──────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│  抽屉左侧滑入                        │
│  ┌───────────────────────────────┐  │
│  │ 聊天历史  [新建对话]           │  │
│  │ ├── 会话 1                   │  │
│  │ ├── 会话 2                   │  │
│  │ └── ...                     │  │
│  ├───────────────────────────────┤  │
│  │ 👤 Avatar  用户名         ›  │  │  ← UserInfoBar
│  └───────────────────────────────┘  │
└──────────┬──────────────────────────┘
           ▼ (点击用户信息区域)
┌─────────────────────────────────────┐
│  设置弹窗从底部拉起（~75% 高度）     │
│  ┌───────────────────────────────┐  │
│  │ ─── (拖拽条)                   │  │
│  │ 设置                           │  │
│  │                               │  │
│  │ 👤 账号管理              ›    │  │
│  │ 🤖 模型设置              ›    │  │
│  │ 🎨 外观设置              ›    │  │
│  │ 💾 数据管理              ›    │  │
│  │ 📚 知识库                ›    │  │
│  │ 🔌 MCP                   ›    │  │
│  │ 🛠️ 技能                 ›    │  │
│  │ ℹ️ 关于                  ›    │  │
│  │ 🚪 退出登录                    │  │
│  └───────────────────────────────┘  │
└──────────┬──────────────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
  账号管理      知识库/MCP/技能
  (堆叠弹窗)    (全屏页面导航)
     │           │
     ▼           ▼
┌────────────┐  ┌────────────────────┐
│ 子弹窗覆盖  │  │ ← 返回  知识库     │
│ 主弹窗~80% │  │                    │
│ ───        │  │ [KnowledgeBasePanel│
│ ← 账号管理  │  │  全屏内容]         │
│            │  │                    │
│ [头像]     │  │                    │
│ [昵称]     │  │                    │
│ [简介]     │  │                    │
│ [保存]     │  │                    │
└────────────┘  └────────────────────┘
```

### 底部弹窗关闭规则

| 操作 | 行为 |
|------|------|
| 点击遮罩层 | 关闭当前最顶层弹窗（子弹窗→主弹窗→关闭） |
| 下滑拖拽 | 关闭当前最顶层弹窗（子弹窗→主弹窗→关闭） |
| 子弹窗左上角 ← 返回 | 关闭子弹窗，回到主菜单 |
| 全屏页面左上角 ← 返回 | `navigate(-1)` 回到聊天页 |
| Android 物理返回键 | 同点击遮罩层逻辑 |

## 状态管理变更

### ChatContext 新增 Action

```typescript
// ChatContext.tsx - 新增
type ChatAction =
  | ...
  | { type: 'SET_MOBILE_SETTINGS_OPEN'; payload: boolean }  // 移动端设置弹窗
  | { type: 'SET_MOBILE_SETTINGS_SUB_SHEET'; payload: SubSheetType | null }  // 子弹窗类型

interface ChatState {
  ...
  mobileSettingsOpen: boolean;      // 移动端主设置弹窗
  mobileSettingsSubSheet: SubSheetType | null;  // 当前子弹窗
}

type SubSheetType = 'account' | 'model' | 'appearance' | 'data' | 'about' | 'logout';
```

### 废弃的 Action

- ChatHeader 移除 `SET_SHOW_CHAT_SETTINGS` dispatch（桌面端通过 Sidebar 下拉菜单仍保留）
- ChatHistoryDrawer 移除知识库/MCP/技能 Toggle 按钮的 dispatch（迁移到设置弹窗内）

## KeepAlive 机制

### 架构

```typescript
// apps/chat/src/components/KeepAlive.tsx

interface KeepAliveProps {
  /** 需要保持挂载的路径前缀 */
  paths: string[];
  children: React.ReactNode;
}

function KeepAlive({ paths, children }: KeepAliveProps) {
  const location = useLocation();
  const isActive = paths.some(p => location.pathname.startsWith(p));
  
  return (
    <div style={{ 
      display: isActive ? '' : 'none',
      height: '100%',
    }}>
      {children}
    </div>
  );
}
```

### 使用方式

```typescript
// App.tsx
<div className="app-container">
  {/* 始终保持 /chat 页面挂载 */}
  <KeepAlive paths={['/chat']}>
    <Routes>
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  </KeepAlive>

  {/* 设置页面，带转场动画 */}
  <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      <Route path="/chat/settings/knowledge-base" element={
        <PageTransition><KnowledgeBasePage /></PageTransition>
      } />
      <Route path="/chat/settings/mcp" element={
        <PageTransition><MCPSettingsPage /></PageTransition>
      } />
      <Route path="/chat/settings/skills" element={
        <PageTransition><SkillSettingsPage /></PageTransition>
      } />
    </Routes>
  </AnimatePresence>
</div>
```

### 优势

- DOM 一直挂载 → 聊天输入框内容、消息列表、滚动位置全部自然保留
- 切换回 `/chat` 时动画恢复到可见状态，视觉流畅
- 不用手动管理 sessionStorage / Context 存储恢复

### 注意事项

- `<KeepAlive>` 内部 Routes 的 `/chat` 路由不会触发 `useEffect` 的 mount/unmount（因为 DOM 未卸载）
- 如有需要监听页面可见性的逻辑，使用 `IntersectionObserver` 或 props 驱动

## 转场动画

### 依赖

新增 `framer-motion`:

```bash
pnpm add framer-motion --filter @abner-blog/chat
```

### PageTransition 组件

```typescript
// apps/chat/src/components/PageTransition.tsx

import { motion } from 'framer-motion';

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { x: '-30%', opacity: 0.5, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
};

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ position: 'absolute', inset: 0 }}
    >
      {children}
    </motion.div>
  );
}
```

### 行为

| 操作 | 动画 |
|------|------|
| 进入设置页 | 页面从右侧滑入（`translateX: 100% → 0`） |
| 返回聊天页 | 页面从左侧滑出（`translateX: 0 → -30%` + 淡出） |
| 设置子页面间跳转 | 同上 |

## 桌面端数据管理 Tab

### ChatSettingsModal 新增 Tab

在 Profile Tab 和 Appearance Tab 之间插入「数据」Tab：

```typescript
// ChatSettingsModal 的 Tab 顺序更新
const tabs = [
  { key: 'model', label: '模型', icon: <RobotOutlined /> },
  { key: 'chat', label: '聊天', icon: <MessageOutlined /> },
  { key: 'profile', label: '个人资料', icon: <UserOutlined /> },
  { key: 'data', label: '数据', icon: <DatabaseOutlined /> },  // 新增
  { key: 'appearance', label: '外观', icon: <BgColorsOutlined /> },
  { key: 'about', label: '关于', icon: <InfoCircleOutlined /> },
];
```

### 数据管理 Tab 内容

```
数据管理
├── 📥 导入聊天记录
│   └── 点击后弹出文件选择器（JSON 格式），导入到当前会话列表
├── 📤 导出聊天记录
│   └── 点击后下载所有会话为 JSON 文件
└── 🗑️ 清除所有记录
    └── Popconfirm 二次确认后清除所有本地 + 服务端会话
```

### 与移动端数据管理对齐

移动端 DataSubSheet 包含相同的三个操作，交互改为底部弹窗形式。

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `apps/chat/src/components/KeepAlive.tsx` | KeepAlive 页面缓存组件 |
| `apps/chat/src/components/PageTransition.tsx` | framer-motion 转场动画组件 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/index.tsx` | 底部设置主弹窗 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/index.less` | 底部弹窗样式 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/AccountSubSheet.tsx` | 账号管理子弹窗 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/ModelSubSheet.tsx` | 模型设置子弹窗 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/AppearanceSubSheet.tsx` | 外观设置子弹窗 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/DataSubSheet.tsx` | 数据管理子弹窗 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/AboutSubSheet.tsx` | 关于子弹窗 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/LogoutConfirmSheet.tsx` | 退出确认子弹窗 |
| `apps/chat/src/pages/chat/settings/KnowledgeBasePage.tsx` | 知识库全屏页面 |
| `apps/chat/src/pages/chat/settings/MCPSettingsPage.tsx` | MCP 全屏页面 |
| `apps/chat/src/pages/chat/settings/SkillSettingsPage.tsx` | 技能全屏页面 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `apps/chat/src/App.tsx` | 添加新路由、KeepAlive、AnimatePresence 动画包装 |
| `apps/chat/src/pages/chat/index.tsx` | 引入 MobileSettingsSheet、新增状态 dispatch 支持 |
| `apps/chat/src/pages/chat/index.less` | 底部弹窗、全屏页面、转场动画相关样式 |
| `apps/chat/src/pages/chat/context/ChatContext.tsx` | 新增 mobileSettingsOpen、mobileSettingsSubSheet 状态 + actions |
| `apps/chat/src/pages/chat/constants.ts` | 新增 SubSheetType 类型定义 |
| `apps/chat/src/pages/chat/components/ChatHeader/index.tsx` | 移除 SettingOutlined 按钮（桌面端+移动端） |
| `apps/chat/src/pages/chat/components/ChatHistoryDrawer.tsx` | 底部替换为用户信息区，去掉 toggle 按钮 |
| `apps/chat/src/pages/chat/components/ChatSettingsModal/index.tsx` | 新增「数据」Tab |
| `apps/chat/src/i18n/locales/zh-CN.json` | 新增设置菜单、数据管理相关文案 |
| `apps/chat/src/i18n/locales/en.json` | 同上（英文） |
| `apps/chat/src/i18n/locales/zh-TW.json` | 同上（繁体） |
| `apps/chat/package.json` | 新增 framer-motion 依赖 |

## 实施计划

### 第一阶段：基础设施（预估 1-2 天）

1. 新增 `framer-motion` 依赖
2. 创建 `KeepAlive.tsx` 组件
3. 创建 `PageTransition.tsx` 组件
4. 重构 `App.tsx`：添加新路由 + KeepAlive + AnimatePresence
5. 更新 `ChatContext`：新增 `mobileSettingsOpen`、`mobileSettingsSubSheet` 状态和 action
6. 更新 `constants.ts`：新增 `SubSheetType` 类型

### 第二阶段：移动端设置体系（预估 2-3 天）

1. 创建 `MobileSettingsSheet/index.tsx` + `index.less`（底部拉起的半弹窗容器）
2. 修改 `ChatHistoryDrawer.tsx`：底部区域替换为 `UserInfoBar`
3. 修改 `ChatHeader/index.tsx`：移除 `SettingOutlined` 按钮
4. 创建子弹窗组件：AccountSubSheet、ModelSubSheet、AppearanceSubSheet、DataSubSheet、AboutSubSheet、LogoutConfirmSheet
5. 更新 `index.tsx`：集成 MobileSettingsSheet
6. 更新 `index.less`：移动端弹窗、用户信息区样式

### 第三阶段：全屏设置页面（预估 1-2 天）

1. 创建 `KnowledgeBasePage.tsx`（包装 KnowledgeBasePanel）
2. 创建 `MCPSettingsPage.tsx`（包装 MCPServerPanel）
3. 创建 `SkillSettingsPage.tsx`（包装 SkillPanel）
4. 设置页面路由和懒加载配置

### 第四阶段：桌面端数据管理（预估 0.5 天）

1. ChatSettingsModal 新增「数据」Tab
2. 实现导入/导出/清除逻辑
3. 对齐移动端数据管理子弹窗的操作逻辑

### 第五阶段：i18n + 样式打磨（预估 0.5 天）

1. 新增三语翻译文案（设置菜单、子弹窗、数据管理等）
2. 弹窗动画调优
3. 移动端适配测试（多尺寸、safe-area、输入法弹出兼容等）

## 移动端底部弹窗组件技术方案

### 弹窗容器（MobileSettingsSheet）

```typescript
interface MobileSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

// 内部状态
// - currentSubSheet: SubSheetType | null  // 当前展示的子弹窗
// - 拖拽关闭手势处理（pan gesture via framer-motion）
```

### 弹窗交互

- 使用 `<Drawer placement="bottom" height="75vh" />` 而非自定义组件（减少重复开发）
- 或使用自定义 `motion.div` 实现更精确的拖拽手势（推荐）
  - 初始位置：`translateY(100%)`（屏幕外底部）
  - 打开动画：`translateY(0)`（滑入，75vh 高度）
  - 关闭：向下拖拽超过阈值（50% 高度）或点击遮罩 → `translateY(100%)`

### 子弹窗栈式堆叠

```
// 主弹窗渲染结构
<div className="mobile-settings-sheet">
  <div className="sheet-handle" /> {/* 拖拽条 */}
  
  {currentSubSheet === null ? (
    <div className="sheet-menu">
      {/* 主菜单列表 */}
    </div>
  ) : (
    <div className="sheet-sub">
      <div className="sub-header">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={goBack} />
        <span>{subSheetTitle}</span>
      </div>
      {renderSubSheet()}
    </div>
  )}
</div>
```

子弹窗不单独管理 `visible` 状态，而是通过在 `currentSubSheet` 变化时触发内部动画（`AnimatePresence` + `motion.div`），实现覆盖式滑入效果。

## 移动端底部设置菜单与 PC 端 ChatSettingsModal 映射关系

| 移动端菜单项 | PC 端位置 | 数据来源 |
|-------------|-----------|---------|
| 账号管理 | ChatSettingsModal > Profile Tab | Redux auth.user + PATCH /api/users/profile |
| 模型设置 | ChatSettingsModal > Model Tab | Context state (vendor/model/apiKeys/params) |
| 外观设置 | ChatSettingsModal > Appearance Tab | Redux theme (theme/skin) + i18n |
| 数据管理 | **新增** ChatSettingsModal > Data Tab | 本地 + 服务端会话 |
| 知识库 | 独立设置页面 | KnowledgeBasePanel (现有) |
| MCP | 独立设置页面 | MCPServerPanel (现有) |
| 技能 | 独立设置页面 | SkillPanel (现有) |
| 关于 | ChatSettingsModal > About Tab | Context state |
| 退出登录 | Sidebar 下拉菜单 | Redux auth.logout |

## 设计约束

1. **桌面端不动移动端**：避免修改桌面端 ChatSidebar/FooterUserSection 现有交互
2. **组件复用最大化**：知识库/MCP/技能页面直接复用现有 Panel 组件，只加外壳层
3. **渐进增强**：所有新增功能对桌面端体验无侵入（除移除 Header 按钮和新数据 Tab）
4. **移动端优先**：弹窗交互默认从底部滑出，菜单项列表清晰，子弹窗确保单手可操作
5. **无嵌套弹窗问题**：子弹窗使用栈式管理，同一时间只显示一个弹窗层级
