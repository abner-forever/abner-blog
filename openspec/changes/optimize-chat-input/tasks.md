# 优化聊天输入框 — 任务分解

> 基于 `proposal.md` 的实施任务。

---

## 任务 1：ChatInput 布局重构

**涉及文件**: `apps/chat/src/pages/chat/components/ChatInput.tsx`

- [ ] 将 `chat-send-fab` 从 `.chat-input-tools__right` 移入 textarea 内部（绝对定位，右下角）
- [ ] 新增语音按钮，并列放在发送按钮左侧
- [ ] 移除 `.chat-input-tools__right` 中的 `sendShortcutHint` 渲染
- [ ] 移除 `.chat-input-tools__right` 中的发送按钮（已移到 textarea 内）
- [ ] 模型选择器（Select）保留在 `.chat-input-tools__right`，改为 pill 样式
- [ ] 调整 props 传递：新增语音相关 props（`isRecording`, `onVoiceStart`, `onVoiceEnd` 等）

## 任务 2：语音输入实现（Web Speech API）

**涉及文件**: `apps/chat/src/pages/chat/components/ChatInput.tsx`、`apps/chat/src/pages/chat/context/ChatContext.tsx`

- [ ] 在 `ChatContext` 新增录音状态：`isRecording`、`voiceText`、`voiceError`、`voiceSupported`
- [ ] 在 ChatInput 内封装 `useVoiceInput` hook：
  - `SpeechRecognition` 初始化（`lang: 'zh-CN'`，`interimResults: true`）
  - `start()` / `stop()` / `abort()` 方法
  - 浏览器支持检测（不支持时隐藏 🎤 按钮）
  - 错误处理（麦克风权限拒绝、识别失败）
- [ ] 录音中 textarea 显示占位文本「🎤 正在录音...」
- [ ] interim 结果实时回填到 textarea（灰色虚线文字）
- [ ] 最终文本提交（填入 textarea，自动触发 onChange）
- [ ] 移动端：`touchstart`/`touchend` 按住说话；桌面端：`click` 切换录音

## 任务 3：Voice UI 动画与反馈

**涉及文件**: `apps/chat/src/pages/chat/components/ChatInput.tsx`、`apps/chat/src/pages/chat/index.less`

- [ ] 语音按钮录音中 pulse 动画（`@keyframes pulse-recording`）
- [ ] 录音中输入框边框变色（accent → error 红色系过渡）
- [ ] 语音按钮图标切换：🎤（空闲）→ 🔴（录音中）
- [ ] 录音出错时（权限拒绝/识别失败）错误提示（antd message 或内联提示）

## 任务 4：模型展示文字统一

**涉及文件**: `apps/chat/src/pages/chat/components/ChatInput.tsx`、`apps/chat/src/pages/chat/index.less`

- [ ] `chat-input-model-selector` 的 font-size 改为 `var(--chat-font-base)` (14px)
- [ ] 下拉菜单 `.chat-input-model-selector-dropdown` 的选项 font-size 统一为 14px
- [ ] 颜色使用 `var(--chat-text)`，字重 normal
- [ ] 模型 pill 高度改为 32px 与 `chat-tool-btn` 一致

## 任务 5：textarea 高度过渡动画

**涉及文件**: `apps/chat/src/pages/chat/components/ChatInput.tsx`、`apps/chat/src/pages/chat/index.less`

- [ ] textarea 高度变化加 `transition: height 0.2s ease`
- [ ] 附件预览行优化：无附件时不渲染（移除 `display: none` 改为条件渲染）
- [ ] 检查 `autoSize` 的 `minRows` 切换是否与 transition 兼容（可能需要改为手动计算 height）

## 任务 6：样式打磨

**涉及文件**: `apps/chat/src/pages/chat/index.less`

- [ ] textarea 内部绝对定位的按钮容器样式（发送按钮 + 语音按钮，z-index 管理）
- [ ] 底部工具栏 padding/margin 调整（释放的空间重新分配）
- [ ] 移动端适配：发送/语音按钮尺寸、safe-area 适配、键盘弹出兼容
- [ ] 暗色/亮色主题下语音按钮的可见性

## 任务 7：i18n 文案

**涉及文件**: `apps/chat/src/i18n/locales/zh-CN.json`、`en.json`、`zh-TW.json`

- [ ] 新增语音相关文案：`voice.recording`、`voice.error.permission`、`voice.error.not-supported` 等
