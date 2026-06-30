# 聊天移动端设置体系 V2 — 全屏页面 + 拖拽半弹窗

> **版本**: v2.0
> **日期**: 2026-06-30
> **状态**: 规划中
> **前置规范**: [移动端设置体系 V1](mobile-settings-architecture.md)

## 概述

本规范在 V1 的 KeepAlive + MobileSettingsSheet + 路由页面架构基础上，进行**第二轮交互重构**。根据 V1 实施后的使用反馈和移动端体验优化需求，将设置入口从半弹窗 Drawer 改为全屏页面，并引入拖拽半弹窗交互。

### 核心变更

| 对比项 | V1（当前实现） | V2（目标） |
|--------|---------------|-----------|
| 设置首页 | MobileSettingsSheet 底部半弹窗（75vh Drawer） | `/chat/settings` 全屏页面（KeepAlive 缓存） |
| 简单设置入口 | MobileSettingsSheet 内嵌子面板（堆叠弹窗） | 设置页面点击 → 底部覆盖式拖拽 Sheet |
| 拖拽交互 | 无（antd Drawer 无原生拖拽） | framer-motion `drag="y"` 拖拽关闭 |
| 退出登录 | LogoutConfirmSubSheet 自定义弹窗 | antd `Modal.confirm`（定制样式） |
| 组件复用 | 每个设置项独立：页面/Sheet/SubSheet 三份代码 | 提取共享表单组件，统一维护 |
| 设置入口 | ChatHistoryDrawer 底部用户信息 | ChatHeader 右上角齿轮图标 + Drawer 用户栏保留 |

### 设计原则

1. **移动端优先**：页面转场 + 拖拽 Sheet + 安全区适配
2. **一致性**：所有 Sheet 统一圆角（16px）、统一的拖拽行为、统一的头部样式
3. **组件复用最大化**：表单逻辑提取为独立组件，全屏页面和 Sheet 共享同一份代码
4. **桌面端不动**：ChatSettingsModal 保持现有交互，仅复用共享组件

## 决策记录

### V1 决策继承（不变）

| 编号 | 决策 | 结论 |
|------|------|------|
| D4 | 知识库/MCP/技能交互 | 保持全屏路由页面 |
| D10 | 页面缓存 | `<KeepAlive>` display:none 模式 |
| D11 | 转场动画 | framer-motion PageTransition |
| D12 | 路由路径 | `/chat/settings/knowledge-base`, `/mcp`, `/skills` |

### V2 新决策

| 编号 | 决策 | 结论 |
|------|------|------|
| D2.1 | 设置首页形态 | **全屏页面** `/chat/settings`，替代 V1 的 MobileSettingsSheet 主菜单 Drawer |
| D2.2 | 移动端入口 | ChatHeader 右上角新增 `SettingOutlined` 齿轮图标 + ChatHistoryDrawer 底部用户区（跳转设置页） |
| D2.3 | 桌面端入口 | 保持现有交互（Sidebar 下拉菜单 → ChatSettingsModal），不修改 |
| D2.4 | 简单设置交互 | 覆盖式**底部拖拽 Sheet**（从当前页面底部拉起），非路由跳转 |
| D2.5 | 拖拽实现 | **framer-motion `drag="y"`** + 阈值判断（拖动 > 30% 高度则关闭，否则回弹） |
| D2.6 | Sheet 样式 | 固定圆角 `border-radius: 16px 16px 0 0`，自适应高度（max 85vh） |
| D2.7 | 退出登录 | **antd `Modal.confirm`**（定制主题色圆角样式），替代 LogoutConfirmSubSheet |
| D2.8 | 组件共享 | 从 `AccountPage`/`ModelPage`/`AppearancePage`/`DataPage`/`AboutPage` 中提取表单内容为独立渲染函数/组件 |
| D2.9 | SubSheet 废弃 | V1 的 `MobileSettingsSheet` 及其子 SubSheet 组件整体废弃，| 由新架构替代 |
| D2.10 | Android 后退 | `useBlocker` + 浏览器历史管理，Sheet 打开时后退关闭 Sheet 而非离开页面 |

## 路由架构

### 新增路由

```typescript
// apps/chat/src/App.tsx — AnimatePresence 内新增
<Route path="/chat/settings" element={
  <PageTransition><SettingsPage /></PageTransition>
} />
```

### 路由容器结构（V2）

```
App (BrowserRouter)
├── KeepAlive (always mounted)
│   └── Routes
│       ├── /login → Login
│       ├── /chat → ChatPage
│       ├── /chat/share/:shareId → ChatSharePage
│       └── /chat/settings/* → null (占位，防 Redirect)
│
├── AnimatePresence mode="wait" (页面转场)
│   └── Routes (location.key based)
│       ├── /chat/settings → SettingsPage (V2 新增：设置首页)
│       ├── /chat/settings/knowledge-base → KnowledgeBasePage
│       ├── /chat/settings/mcp → MCPSettingsPage
│       └── /chat/settings/skills → SkillSettingsPage
```

设置首页与复杂设置页面共享同一层 AnimatePresence，保证：
- `/chat` → `/chat/settings`：页面从右侧滑入
- `/chat/settings` → 子页面：再次从右侧滑入（堆叠效果）
- 返回时依次从左侧滑出

## 组件树

### 移动端整体组件层级

```
ChatPage (KeepAlive 保持挂载)
├── ChatHeader
│   ├── 左侧汉堡菜单按钮
│   ├── 聊天标题
│   └── 右侧 ⚙️ SettingsOutlined (V2 新增：齿轮入口)
│
├── ChatHistoryDrawer
│   └── drawer-footer → 点击 → navigate('/chat/settings')
│       ├── Avatar + UserName
│       └── RightArrow
│
├── ChatMainArea
│   ├── 消息列表
│   └── 输入区
│
└── [Desktop only] ChatSettingsModal

SettingsPage (PageTransition 包裹)
├── page-header
│   ├── ← BackArrow
│   └── 设置
├── page-content
│   └── SettingsMenuList (V2 新增：列表式分组菜单)
│       ├── 分组 1: 偏好设置
│       │   ├── 🤖 模型设置 → DraggableSheet<ModelSheetContent>
│       │   ├── 🎨 外观设置 → DraggableSheet<AppearanceSheetContent>
│       │   └── 💾 数据管理 → DraggableSheet<DataSheetContent>
│       ├── 分组 2: 扩展功能
│       │   ├── 📚 知识库 → navigate('/chat/settings/knowledge-base')
│       │   ├── 🔌 MCP 服务 → navigate('/chat/settings/mcp')
│       │   └── 🛠️ 技能市场 → navigate('/chat/settings/skills')
│       ├── 分组 3: 其他
│       │   ├── 👤 账号管理 → DraggableSheet<AccountSheetContent>
│       │   ├── ℹ️ 关于 → DraggableSheet<AboutSheetContent>
│       │   └── 🚪 退出登录 → antd Modal.confirm
│       └── (分组之间有间距，每组有组标题)
│
├── DraggableSheet (framer-motion，尾随 SettingsPage 渲染)
│   ├── sheet-handle (拖拽条)
│   ├── sheet-header (标题)
│   └── sheet-body (根据当前 sheetKey 渲染对应表单内容)
│       ├── AccountSheetContent
│       ├── ModelSheetContent
│       ├── AppearanceSheetContent
│       ├── DataSheetContent
│       └── AboutSheetContent
│
└── [Styled antd Modal.confirm - 退出登录]
```

### DraggableSheet 组件设计

```typescript
// apps/chat/src/components/DraggableSheet.tsx

interface DraggableSheetProps {
  /** 是否展示 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 子内容 */
  children: React.ReactNode;
}

// 实现要点
// - motion.div: initial → { y: '100%' }, animate → { y: 0 }
// - drag="y", dragConstraints={{ top: 0 }}, dragElastic={0.8}
// - onDragEnd: velocity.y > 500 || offset.y > 容器高度*0.3 → 关闭，否则回弹
// - 遮罩层 backdrop（点击关闭）
// - z-index: 1000（高于页面内容，低于 antd Modal）
// - overscroll-behavior: contain（防页面跟随滚动）
// - 键盘可访问性：Escape 关闭
```

### Styled Modal.confirm（退出登录）

```typescript
// 使用 antd App.useApp() 的 modal api，而非静态 Modal.confirm
// 以支持 ConfigProvider 主题定制

const { modal } = App.useApp();

const showLogoutConfirm = () => {
  modal.confirm({
    title: t('chat.logoutConfirm'),
    content: t('chat.logoutConfirmHint'),
    okText: t('nav.logout'),
    cancelText: t('common.cancel'),
    okButtonProps: { danger: true },
    className: 'logout-confirm-modal',
    // 样式定制：
    // - border-radius: 12px
    // - title 部分加大字号
    // - 确认按钮红色主题（danger 已提供）
    // - 通过 ConfigProvider theme 或 CSS 变量维持暗色/浅色一致
  });
};
```

## 交互流程

### 移动端设置完整交互

```
1. 用户打开 ChatPage
   │
2. 点击 ChatHeader 右上角 ⚙️ 齿轮图标
   │  或 打开 ChatHistoryDrawer → 点击底部用户信息栏
   │
   ▼
3. 页面转场（framer-motion PageTransition）
   KeepAlive 将 ChatPage 设为 display:none
   SettingsPage 从右侧滑入
   │
   ▼
4. SettingsPage 展示分组菜单列表
   │
   ├── 点击「模型设置」
   │   ▼
   │   DraggableSheet 从底部滑入（y: 100% → 0）
   │   显示 ModelSheetContent（供应商/模型/API Key/滑块）
   │   ├── 调整参数后点击「保存」→ Sheet 关闭 + toast 提示
   │   ├── 点击遮罩/下滑拖动 > 阈值 → Sheet 关闭（不回弹）
   │   └── 下滑不足阈值 → Sheet 回弹到原始位置
   │
   ├── 点击「知识库」
   │   ▼
   │   页面转场到 /chat/settings/knowledge-base（全屏页面）
   │   返回按钮 navigate(-1) 回到 SettingsPage
   │
   └── 点击「退出登录」
       ▼
       antd Modal.confirm 弹出（居中弹窗，圆角样式）
       ├── 确认 → reduxDispatch(logout()) → navigate('/chat', { replace: true })
       └── 取消 → 关闭弹窗
```

### 拖拽手势细节

```
手势触摸     drag="y"
                  │
  触摸向下滑动    │
                  ▼
  ┌──────────────────────────────────────┐
  │  ─── (拖拽条)       ← 可拖拽区域      │
  │                                       │
  │  Sheet 跟随手指位移                     │
  │  translateY = drag offset             │
  │                                       │
  │  [内容区域] ← 内可滚动，顶部时手势生效    │
  │          scrollTop === 0 才激活 drag   │
  │          否则优先内部滚动               │
  └──────────────────────────────────────┘
        │
        ├── offset > 30% 高度 + velocity > 200
        │   → animate: { y: '100%' } → onClose()
        │
        └── offset < 30% 高度 || velocity < 200
            → animate: { y: 0 } (回弹)
```

### 页面转场 + Sheet 共存时的 z-index 层级

```
层级 2000+  antd Modal.confirm（退出登录弹窗）
层级 1000+  DraggableSheet（底部拖拽弹窗）
层级 100     SettingsPage（AnimatePresence 内）
层级 0-99    ChatPage（KeepAlive display:none）
```

## 组件提取策略

### 共享表单内容抽取

原有三份冗余代码的合并策略：

```
现有文件                           提取为                              被引用
────────────────────────────────────────────────────────────────────────────────
AccountPage.tsx                  → AccountSheetContent               被 SettingsPage 的 DraggableSheet 引用
                                                                      + ChatSettingsModal Profile Tab 引用
ModelPage.tsx                    → ModelSheetContent                 同上
AppearancePage.tsx               → AppearanceSheetContent            同上
DataPage.tsx                     → DataSheetContent                  同上
AboutPage.tsx                    → AboutSheetContent                 同上

废弃文件：
MobileSettingsSheet/* (组件 + 样式)
├── AccountSubSheet.tsx
├── ModelSubSheet.tsx
├── AppearanceSubSheet.tsx
├── DataSubSheet.tsx
├── AboutSubSheet.tsx
└── LogoutConfirmSubSheet.tsx
```

### 提取的文件结构

```
apps/chat/src/pages/chat/settings/
├── SettingsPage.tsx                 ← 设置首页（路由页面，菜单列表 + DraggableSheet 容器）
├── SettingsPage.less                ← 设置页面 + DraggableSheet 样式
├── SettingsMenuList.tsx             ← 分组菜单列表组件（纯 UI，接收 onItemClick 回调）
│
├── shared/                          ← 共享表单内容（独立渲染组件，无页面 shell）
│   ├── AccountSheetContent.tsx      ← 账号表单内容
│   ├── ModelSheetContent.tsx        ← 模型设置表单内容
│   ├── AppearanceSheetContent.tsx   ← 外观设置表单内容
│   ├── DataSheetContent.tsx         ← 数据管理表单内容
│   ├── AboutSheetContent.tsx        ← 关于信息展示
│   └── index.ts                     ← barrel export
│
├── AccountPage.tsx                  ← 保留（仅 import { AccountSheetContent } 套页面壳）
├── ModelPage.tsx                    ← 保留（同上）
├── AppearancePage.tsx               ← 保留（同上）
├── DataPage.tsx                     ← 保留（同上）
├── AboutPage.tsx                    ← 保留（同上）
│
├── KnowledgeBasePage.tsx            ← 保留（已有实现）
├── MCPSettingsPage.tsx             ← 保留（已有实现）
└── SkillSettingsPage.tsx           ← 保留（已有实现）

apps/chat/src/components/
├── DraggableSheet.tsx               ← 通用拖拽半弹窗组件
└── DraggableSheet.less              ← 样式
```

### AccountPage 等保留页面的变化

现有 `AccountPage` 等文件从内联实现改为委托：

```typescript
// AccountPage.tsx (重构后)
import AccountSheetContent from './shared/AccountSheetContent';

const AccountPage: React.FC = () => {
  return (
    <div className="settings-fullscreen-page">
      <div className="settings-page-header">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
        <span>{t('chat.accountSettings')}</span>
      </div>
      <div className="settings-page-content">
        <AccountSheetContent onSave={() => navigate(-1)} />
      </div>
    </div>
  );
};
```

这样 AccountPage 的独立路由（如果未来需要）保留，且与 Sheet 内展示的内容 100% 一致。

## 状态管理变更

### ChatContext 变更

```typescript
// ChatContext.tsx — 修改
interface ChatState {
  // ...已有状态保持不变...

  // V1 字段 → 移除 (废弃 MobileSettingsSheet 模式)
  // mobileSettingsOpen: boolean;          ← 移除
  // mobileSettingsSubSheet: SubSheetType | null;  ← 移除
  
  // V2 新增
  settingsSheetOpen: boolean;       // 拖拽 Sheet 是否展示
  settingsSheetKey: SheetKey | null; // 当前 Sheet 内容类型
}

// 新增类型
type SheetKey = 'account' | 'model' | 'appearance' | 'data' | 'about';

// 新增 Action
type ChatAction =
  | { type: 'SET_SETTINGS_SHEET'; payload: { open: boolean; key?: SheetKey } }
  // 设置 Sheet 打开/关闭，打开时指定 key
```

### constants.ts 变更

```typescript
// constants.ts — 修改
// SubSheetType 保留（暂无其他用途可移除）
// 新增
export type SheetKey = 'account' | 'model' | 'appearance' | 'data' | 'about';
```

## DraggableSheet 详细设计

### Props

```typescript
interface DraggableSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
```

### 动画参数

```typescript
const sheetVariants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: { 
      type: 'spring', 
      damping: 30, 
      stiffness: 300 
    }
  },
  exit: { 
    y: '100%',
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 400
    }
  },
};
```

### 拖拽逻辑

```typescript
const handleDragEnd = (_: any, info: PanInfo) => {
  const threshold = window.innerHeight * 0.3; // 30% 高度阈值
  const shouldClose = info.offset.y > threshold || info.velocity.y > 500;
  
  if (shouldClose) {
    onClose();
  }
  // 否则 framer-motion 自动回弹（drag 无 rubber band，需设置 dragElastic={0.5}）
};
```

### 内容区域滚动与拖拽冲突处理

关键实现：Sheet 内可滚动区域在 `scrollTop > 0` 时禁止拖拽，仅在顶部时激活：

```typescript
// 在 DraggableSheet 内部
const contentRef = useRef<HTMLDivElement>(null);
const [isAtTop, setIsAtTop] = useState(true);

// 监听可滚动区域的 scroll 事件
useEffect(() => {
  const el = contentRef.current;
  if (!el) return;
  const handleScroll = () => {
    setIsAtTop(el.scrollTop <= 0);
  };
  el.addEventListener('scroll', handleScroll, { passive: true });
  return () => el.removeEventListener('scroll', handleScroll);
}, []);

// 仅当 isAtTop 时启用 drag
<motion.div
  drag={isAtTop ? 'y' : false}
  ...
>
```

### 键盘与可访问性

- 打开时焦点移到 Sheet 内第一个可聚焦元素
- `Escape` 键关闭 Sheet
- `aria-modal="true"` 正确标识
- 关闭后焦点返回到触发元素

## 样式规范

### DraggableSheet

```less
// DraggableSheet.less
.draggable-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  background: var(--ds-bg-secondary);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  // safe-area
  padding-bottom: env(safe-area-inset-bottom, 0);

  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.45);
  }

  &__handle {
    width: 36px;
    height: 4px;
    margin: 8px auto;
    background: var(--ds-text-tertiary, rgba(255,255,255,0.2));
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    flex-shrink: 0;

    &-title {
      font-size: 17px;
      font-weight: 600;
      color: var(--ds-text);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 16px 16px;
    overscroll-behavior: contain;
  }
}
```

### SettingsPage

```less
// SettingsPage.less
.settings-page {
  // 分组式列表
  &__group {
    margin-bottom: 24px;
    
    &-title {
      font-size: 13px;
      color: var(--ds-text-secondary);
      padding: 0 16px 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  &__menu-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    background: var(--ds-bg-secondary);
    cursor: pointer;
    transition: background 0.15s;

    &:active {
      background: var(--ds-bg-tertiary);
    }

    &-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-size: 18px;
      color: var(--ds-accent);
    }

    &-label {
      flex: 1;
      font-size: 16px;
      color: var(--ds-text);
    }

    &-arrow {
      color: var(--ds-text-tertiary);
      font-size: 14px;
    }

    // 第一项和最后一项圆角
    &:first-child {
      border-radius: 12px 12px 0 0;
    }
    &:last-child {
      border-radius: 0 0 12px 12px;
    }
    &:only-child {
      border-radius: 12px;
    }
  }

  // 退出按钮特殊样式
  &__menu-item--logout {
    color: var(--ds-danger, #f5222d);
    .settings-page__menu-item-icon {
      color: var(--ds-danger, #f5222d);
    }
  }
}
```

### LogoutConfirmModal

```less
// 主题变量方式定制 Modal 样式
// 使用 antd ConfigProvider theme 的 token 覆盖
// 或通过 className 定制
.logout-confirm-modal {
  .ant-modal-content {
    border-radius: 12px;
    padding: 24px;
  }
  .ant-modal-confirm-title {
    font-size: 17px;
    font-weight: 600;
  }
  .ant-modal-confirm-content {
    font-size: 14px;
    color: var(--ds-text-secondary);
    margin-top: 8px;
  }
  .ant-modal-confirm-btns {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    
    .ant-btn {
      flex: 1;
      height: 44px;
      border-radius: 10px;
      font-size: 16px;
    }
  }
}
```

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `apps/chat/src/components/DraggableSheet.tsx` | 通用拖拽半弹窗组件（framer-motion drag） |
| `apps/chat/src/components/DraggableSheet.less` | 拖拽半弹窗样式 |
| `apps/chat/src/pages/chat/settings/SettingsPage.less` | 设置页面 + 分组菜单样式 |
| `apps/chat/src/pages/chat/settings/SettingsMenuList.tsx` | 分组菜单列表组件 |
| `apps/chat/src/pages/chat/settings/shared/AccountSheetContent.tsx` | 账号表单内容（从 AccountPage 提取） |
| `apps/chat/src/pages/chat/settings/shared/ModelSheetContent.tsx` | 模型设置表单内容（从 ModelPage 提取） |
| `apps/chat/src/pages/chat/settings/shared/AppearanceSheetContent.tsx` | 外观设置表单内容（从 AppearancePage 提取） |
| `apps/chat/src/pages/chat/settings/shared/DataSheetContent.tsx` | 数据管理表单内容（从 DataPage 提取） |
| `apps/chat/src/pages/chat/settings/shared/AboutSheetContent.tsx` | 关于展示内容（从 AboutPage 提取） |
| `apps/chat/src/pages/chat/settings/shared/index.ts` | barrel export |

### 修改文件

| 文件 | 改动 |
|------|------|
| `apps/chat/src/App.tsx` | + 设置首页路由 `/chat/settings` → SettingsPage |
| `apps/chat/src/pages/chat/index.tsx` | 移除 MobileSettingsSheet 引用，添加齿轮入口 dispatch |
| `apps/chat/src/pages/chat/index.less` | 移除 mobile-settings-sheet 样式，添加 header 齿轮按钮样式 |
| `apps/chat/src/pages/chat/constants.ts` | 移除 SubSheetType，新增 SheetKey |
| `apps/chat/src/pages/chat/context/ChatContext.tsx` | 移除 mobileSettingsOpen/mobileSettingsSubSheet state + actions；新增 settingsSheetOpen/settingsSheetKey |
| `apps/chat/src/pages/chat/components/ChatHeader/index.tsx` | 移动端右上角新增 ⚙️ SettingsOutlined 按钮 |
| `apps/chat/src/pages/chat/components/ChatHistoryDrawer.tsx` | 底部用户栏点击 → navigate('/chat/settings') 替代 dispatch SET_MOBILE_SETTINGS_OPEN |
| `apps/chat/src/pages/chat/settings/AccountPage.tsx` | 委托 shared/AccountSheetContent |
| `apps/chat/src/pages/chat/settings/ModelPage.tsx` | 委托 shared/ModelSheetContent |
| `apps/chat/src/pages/chat/settings/AppearancePage.tsx` | 委托 shared/AppearanceSheetContent |
| `apps/chat/src/pages/chat/settings/DataPage.tsx` | 委托 shared/DataSheetContent |
| `apps/chat/src/pages/chat/settings/AboutPage.tsx` | 委托 shared/AboutSheetContent |
| `apps/chat/src/pages/chat/settings/SettingsPage.tsx` | 从页面跳转菜单 → 分组菜单列表 + DraggableSheet 集成 |
| `apps/chat/src/pages/chat/components/ChatSettingsModal/index.tsx` | Profile/Model/Appearance/Data/About Tab 复用 shared/* 组件 |
| `apps/chat/src/i18n/locales/en.json` | 统一命名+新增分组标题文案 |
| `apps/chat/src/i18n/locales/zh-CN.json` | 同上 |
| `apps/chat/src/i18n/locales/zh-TW.json` | 同上 |

### 删除文件

| 文件 | 说明 |
|------|------|
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/index.tsx` | 废弃（V1 实现） |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/AccountSubSheet.tsx` | 废弃 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/ModelSubSheet.tsx` | 废弃 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/AppearanceSubSheet.tsx` | 废弃 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/DataSubSheet.tsx` | 废弃 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/AboutSubSheet.tsx` | 废弃 |
| `apps/chat/src/pages/chat/components/MobileSettingsSheet/LogoutConfirmSubSheet.tsx` | 废弃 |

## 实施计划

### 第一阶段：基础设施（预估 1 天）

1. 新建 `DraggableSheet.tsx` + `.less` 拖拽半弹窗组件
2. 新建 `SettingsPage.less` 设置页面样式
3. App.tsx 新增 `/chat/settings` 路由（懒加载 SettingsPage）
4. ChatContext 状态迁移：
   - 移除 `mobileSettingsOpen`, `mobileSettingsSubSheet`
   - 新增 `settingsSheetOpen`, `settingsSheetKey`
5. constants.ts 新增 `SheetKey` 类型

### 第二阶段：共享组件提取（预估 1 天）

1. 创建 `shared/` 目录 + barrel export
2. 从 `AccountPage` 提取 `AccountSheetContent`（表单代码）
3. 从 `ModelPage` 提取 `ModelSheetContent`（供应商/模型/滑块等）
4. 从 `AppearancePage` 提取 `AppearanceSheetContent`（主题/皮肤/语言）
5. 从 `DataPage` 提取 `DataSheetContent`（导入/导出/清除）
6. 从 `AboutPage` 提取 `AboutSheetContent`（展示信息）
7. 各原 Page 文件改为委托 shared 组件 + 导航壳

### 第三阶段：设置页面集成（预估 1-2 天）

1. 重写 `SettingsPage.tsx`：
   - 分组式菜单列表（SettingsMenuList 组件）
   - 接入 DraggableSheet + shared/* 组件
   - 知识库/MCP/技能 → navigate 跳转
   - 退出登录 → antd Modal.confirm（定制样式）
2. 实现 SheetKey → 内容映射
3. 实现拖拽手势细节（内容滚动冲突解决）

### 第四阶段：入口改造（预估 0.5 天）

1. ChatHeader 移动端右上角新增齿轮图标
2. ChatHistoryDrawer 底部跳转改为 `navigate('/chat/settings')`
3. Desktop ChatSettingsModal 复用 shared/* 组件，移除内联重复代码

### 第五阶段：V1 清理 + 收尾（预估 0.5 天）

1. 删除 `MobileSettingsSheet/` 整个目录
2. 删除移动端 ChatContext 废弃状态
3. i18n 文案清理与统一
4. 移动端适配测试（安全区、键盘弹出、横竖屏）
5. 桌面端回归测试（ChatSettingsModal 功能完整性）

## 与 V1 规范的决策变更对照

| V1 决策 | V2 变化 | 原因 |
|---------|---------|------|
| D2: 入口在 Drawer 底部用户区 | → 入口增加 Header 齿轮图标 | 设置作为一级功能，需要随时可达 |
| D8: 栈式堆叠子弹窗 | → 全屏设置页面 + 覆盖式拖拽 Sheet | 页面展示信息更多，导航结构更清晰 |
| D6: 退出用自定义底部弹窗 | → antd Modal.confirm（定制样式） | 退出是确认操作，居中弹窗更合适 |
| D9: 子弹窗内联在 MobileSettingsSheet | → shared/* 组件复用 | 消除三份冗余代码 |
| - | → 新增 framer-motion 拖拽手势 | 移动端原生感交互 |
| D10: KeepAlive 仅缓存 `/chat` | → 增加 `/chat/settings` 路由 | 设置首页变成全屏页面 |
