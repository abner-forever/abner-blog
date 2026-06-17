# Design System

本文件定义博客系统的视觉设计语言，所有页面和组件的迭代必须遵循此规范。

## 设计原则

1. **Skin-first** — 所有颜色通过 CSS 变量（`--skin-*`、`--text-*`、`--bg-*`）引用，禁止硬编码色值
2. **Card-based** — 内容以卡片为单位组织，卡片统一圆角、边框、阴影
3. **Motion with purpose** — 动画用于引导注意力（hover 提升、渐入），不用于装饰
4. **Responsive mobile-first** — 断点：`768px`（手机）、`992px`（平板）、`1200px`（桌面）

## 色彩体系

### 语义色（由皮肤主题驱动）

| Token               | 用途               | 默认值（经典皮肤） |
| ------------------- | ------------------ | ------------------- |
| `--skin-primary`    | 主色、按钮、链接    | `#2f81f7`           |
| `--skin-primary-hover` | 主色悬停态       | `#1a6de0`           |
| `--text-main`       | 正文               | `#37352f`           |
| `--text-secondary`  | 次要文字           | `#5d5b54`           |
| `--text-muted`      | 辅助/禁用文字      | `#a4a097`           |
| `--bg-color`        | 页面背景           | `#ffffff`           |
| `--card-bg`         | 卡片背景           | `#ffffff`           |
| `--surface-color`   | 表面色（Hero等）    | `#f6f5f4`           |
| `--border-color`    | 边框               | `#e5e3df`           |
| `--hover-bg`        | 悬停背景           | `#f6f5f4`           |

### 渐变色（用于 Hero、Feature Icon、About Banner）

```
Hero 高亮:   linear-gradient(135deg, var(--skin-primary), #a855f7)
Hero 光球:   var(--skin-primary) / #f093fb / #43e97b (blur 80px, opacity 0.15)
卡片视觉区:  linear-gradient(135deg, var(--skin-primary), #764ba2)
Feature Icon: 每个功能独立渐变（见 FeatureShowcase 组件）
About Banner: linear-gradient(135deg, var(--skin-primary), #a855f7)
```

### 阴影

| Token          | 用途               | 值                                        |
| -------------- | ------------------ | ----------------------------------------- |
| `--shadow-sm`  | 卡片默认           | `0 1px 2px 0 rgba(15,15,15,0.04)`        |
| `--shadow-md`  | 卡片悬停           | `0 4px 12px 0 rgba(15,15,15,0.08)`       |
| `--shadow-lg`  | Hero/Banner 悬停   | `0 16px 48px -8px rgba(15,15,15,0.16)`   |

## 排版

### 字号层级

| 层级        | 字号   | 字重   | 用途                     |
| ----------- | ------ | ------ | ------------------------ |
| H1          | 42px   | 700    | Hero 标题                |
| H2          | 28px   | 700    | 区块标题（最新内容等）    |
| H3          | 17-18px| 600    | 卡片标题                 |
| Body        | 14-15px| 400    | 正文                     |
| Caption     | 12-13px| 400-500| 辅助信息、时间、标签      |
| Badge/Chip  | 11-13px| 500    | 徽章、芯片               |

### 字体栈

```less
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
```

等宽字体（终端/代码）：

```less
font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

## 间距与圆角

| Token                 | 值    | 用途                   |
| --------------------- | ----- | ---------------------- |
| `@border-radius-base` | 12px  | 卡片、输入框           |
| `@border-radius-sm`   | 8px   | 小元素（图标容器）     |
| Hero/About Banner     | 20px  | 大容器                 |
| Feature Card          | 14px  | 列表卡片               |
| Moment Chip           | 12px  | 横向滚动芯片           |

页面内边距：`24px`（桌面）→ `12px`（手机）
区块间距：`40-48px`

## 组件模式

### Hero Banner

- 左侧：问候语 + 渐变标题 + 副标题 + 按钮 + 信息芯片（天气/日期）
- 右侧：终端视觉（深色背景 + 三色圆点 + 打字机光标）
- 背景：三个模糊光球动画（`filter: blur(80px)`）
- 交互：整体无悬浮，终端轻微上下浮动（`6s ease-in-out infinite`）

### Stats Bar

- 水平排列，中间竖线分隔
- 每项：图标（`--skin-primary` 色）+ 数字 + 标签
- 移动端：2×2 网格，隐藏分隔线

### Feature Showcase（快捷入口）

- 垂直列表卡片，每张包含：渐变图标 + 标题 + 描述 + 箭头
- 悬停：右移 4px + 边框变主色 + 箭头淡入
- 图标渐变：每个功能固定一个渐变色（不跟随皮肤）

### Latest Content（最新内容）

- 上方：2 列博客卡片网格（各含渐变视觉区 + 标题 + 时间 + 阅读链接）
- 下方：横向滚动 Moment 芯片条
- 悬停：卡片上浮 2px + 阴影增强 + 视觉区渐变切换

### About Banner

- 全宽渐变背景 + 半透明装饰圆形
- 左侧：图标 + 标题 + 描述
- 右侧：白色 CTA 按钮
- 移动端：垂直居中堆叠

## 动画规范

| 动画              | 触发       | 参数                                |
| ----------------- | ---------- | ----------------------------------- |
| `fadeInUp`        | 页面加载   | `0.5s ease`, `translateY(12px→0)`  |
| `orbFloat`        | Hero 背景  | 8-12s 循环, `translate + scale`     |
| `pulse`           | 在线状态点 | 2s 循环, `opacity 1→0.5`           |
| `blink`           | 终端光标   | 1s step-end 循环                   |
| `terminalFloat`   | 终端视觉   | 6s 循环, `translateY(±6px)`        |
| Card hover        | 鼠标进入   | `0.25-0.3s ease`, `translateY(-2px)` |
| Feature slide     | 鼠标进入   | `0.25s ease`, `translateX(4px)`    |

## 响应式策略

| 断点     | 行为                                             |
| -------- | ------------------------------------------------ |
| >992px   | 桌面：Hero 双栏、博客 2 列网格、完整 Feature 列表 |
| ≤992px   | 平板：隐藏终端视觉、博客单列                      |
| ≤768px   | 手机：Hero 全宽、Stats 2×2、按钮纵向、芯片纵向    |

## 皮肤系统

15+ 套皮肤通过 `data-skin` 属性切换，每套定义完整的 `--skin-*`、`--text-*`、`--bg-*` 变量集。
暗黑模式通过 `data-theme="dark"` 覆盖背景/文字变量。

**规则**：新组件只使用语义 Token，不绑定特定皮肤色值。这样切换皮肤时自动适配。

## 禁止事项

- ❌ 硬编码颜色值（如 `#333`、`red`）
- ❌ 硬编码 API URL
- ❌ 硬编码用户可见文本（必须 i18n）
- ❌ `any` 类型
- ❌ `!important`（除覆盖 antd 全局样式外）
- ❌ LESS 嵌套超过 3 层
- ❌ 组件超过 200 行不拆分
