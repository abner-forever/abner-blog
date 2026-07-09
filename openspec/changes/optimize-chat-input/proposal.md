# 优化聊天输入框：布局重构 + 语音输入 + 模型文字统一

> **提案**: `optimize-chat-input`
> **日期**: 2026-07-03

## Motivation

当前聊天输入框（ChatInput）存在三个问题：

1. **布局拥挤** — 工具栏一行塞了 7 个元素（3 toggle + model Select + 快捷键提示 + 发送按钮 + 语音预占位），视觉权重失衡
2. **模型展示文字不一致** — antd Select 使用默认字体 token，与消息气泡（14px/1.7）和工具栏文字（12px）不统一
3. **无语音输入** — 需从零实现前端语音转文字功能

## Proposal

### 一、输入框布局重构

参考 Claude 网页版的输入框布局，将发送按钮移入 textarea 右下角，释放工具栏空间。

```
┌──────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┬───┐ │
│  │                                      │ 🎤│ │
│  │  在这里输入消息...                    │ ↑ │ │
│  │                                      │   │ │
│  └──────────────────────────────────────┴───┘ │
│                                                │
│  💡 深度思考  🔍 搜索   📎 附件               │
│                              模型: GPT-5 Chat ▼│
└──────────────────────────────────────────────┘
```

具体改动：

| 改动 | 说明 |
|------|------|
| 发送按钮移入 textarea | 右下角叠加定位，圆形 FAB 改为 32×32 |
| 语音按钮并列 | 放在发送按钮左侧，同为 textarea 内部叠加 |
| 移除快捷键提示 | `sendShortcutHint` 不再显示在工具栏 |
| 工具栏只保留 3 toggle | 左侧 3 个 toggle，右侧模型选择器 |
| 模型 Select 改为 pill | 与 `chat-tool-btn` 一致的 32px 圆角样式 |
| textarea 高度过渡 | `minRows` 变化加 CSS transition |

### 二、模型展示区域文字统一

| 元素 | 当前 | 改为 |
|------|------|------|
| 模型选择器 Select | antd 默认 12-14px | `--chat-font-base` (14px) |
| 下拉菜单选项 | antd 默认 | `--chat-font-base` (14px) |
| 按钮文字 | `--chat-font-sm` (12px) | 保持 12px （tool 类按钮应有层级区分） |

模型选择器的字体、颜色、字重与消息气泡文字 (`--chat-text`, `--chat-font-base`) 保持一致。

### 三、语音输入（Web Speech API）

纯前端实现，不需要后端端点。

| 交互 | 实现 |
|------|------|
| PC 端 | 点击 🎤 按钮开始录音，再次点击停止 |
| 移动端 | 按住 🎤 按钮录音，松开发送；上滑取消 |
| 浏览器检测 | 不支持 `SpeechRecognition` 时 🎤 按钮隐藏 |

**流程：**

```
用户点击/按住 🎤
  → navigator.mediaDevices.getUserMedia({ audio: true })
  → SpeechRecognition 实例，lang: zh-CN, interimResults: true
  → 输入框内显示「🎤 正在录音...」占位文本
  → 识别结果实时显示在 textarea（灰度文本+下划线）
  → 录音结束 → 最终文本填入 textarea，恢复正常状态
```

**UI 反馈：**
- 录音中：按钮 pulse 动画（呼吸光晕），输入框边框变色
- 识别中：转写内容逐步显示在 textarea 中
- 识别完成：填入最终文本，按钮恢复

## Impact

| 影响 | 范围 |
|------|------|
| 前端组件 | `ChatInput.tsx` — 结构重写 |
| 样式 | `index.less` — 输入区域 + 语音动画样式 |
| 常量 | `constants.ts` — 可能新增语音相关配置 |
| Context | `ChatContext.tsx` — 新增录音状态 |
| 后端 | **无影响**（Web Speech API 纯前端） |
| 后端（未来） | 可随时加 `/api/ai/stt` 端点作为升级 |

## Non-goals

- 不实现后端 STT 端点（后续可按需增加）
- 不做音频文件上传转写（仅实时录音）
- 不改变消息气泡或消息列表布局
- 不改动设置页的模型选择器（仅改输入框内的）

## 相关文件清单

| 文件 | 改动类型 |
|------|----------|
| `apps/chat/src/pages/chat/components/ChatInput.tsx` | 🔴 重写布局 |
| `apps/chat/src/pages/chat/index.less` | 🔴 大量新增/修改样式 |
| `apps/chat/src/pages/chat/context/ChatContext.tsx` | 🟡 新增 voice states |
| `apps/chat/src/pages/chat/context/ChatMessagesContext.tsx` | 🟢 无改动 |
| `apps/chat/src/pages/chat/index.tsx` | 🟡 传递语音相关 props |
| `apps/chat/src/pages/chat/constants.ts` | 🟢 可能新增常量 |
| `apps/chat/src/styles/chat-tokens.less` | 🟢 可能新增 token |
