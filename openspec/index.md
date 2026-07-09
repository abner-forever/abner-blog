# OpenSpec 规范库

> 本目录遵循 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 规范驱动开发框架。

## 项目约定

| 文件 | 说明 |
|------|------|
| [项目约定](project.md) | 技术栈、API 规范、编码约定（AI 上下文） |
| [配置](config.yaml) | OpenSpec 工具配置（context + rules） |

## 领域规范（`specs/`）

> 真理源规范 — 每个领域的事实来源。

| 规范 | 说明 | 状态 |
|------|------|------|
| [低代码平台](specs/low-code-platform/spec.md) | 低代码页面搭建平台架构设计 | ✅ 活跃 |
| [低代码 Modal 实现](specs/low-code-platform/modal-implementation.md) | 渲染引擎 Modal 弹窗组件实施 | ✅ 活跃 |
| [AI 聊天路由架构](specs/ai-chat/routing-architecture.md) | LangGraph 意图检测、MCP、流式输出路由 | ✅ 活跃 |
| [AI 聊天移动端设置体系 V2](specs/ai-chat/mobile-settings-iteration-2.md) | 全屏设置首页 + 拖拽半弹窗 + 组件共享 | ✅ 活跃 |
| [AI 聊天移动端设置体系 V1](specs/ai-chat/mobile-settings-architecture.md) | V1 — 底部弹窗 + KeepAlive + 转场动画 | 📦 已被 V2 取代 |
| [AI 页面生成](specs/page-generator-ai/spec.md) | AI 驱动的低代码页面自动生成能力 | ✅ 活跃 |
| [AI 页面生成设计](specs/page-generator-ai/design.md) | AI 页面生成技术设计详案 | ✅ 活跃 |
| [Admin SSO 架构](specs/admin/sso-architecture.md) | 管理后台 Keycloak SSO 统一登录架构 | ✅ 活跃 |

## 变更与归档（`changes/`）

> 提案和管理文档 — 非真理源，用于追踪变更和保留历史参考。

| 文档 | 说明 |
|------|------|
| [变更提案流程](changes/README.md) | 提案格式和归档流程说明 |

### 已归档

| 文档 | 原位置 | 说明 |
|------|--------|------|
| [低代码平台进度](changes/archive/low-code-platform-progress/progress.md) | `specs/` | 开发进度跟踪 |
| [低代码平台路线图](changes/archive/low-code-platform-roadmap/roadmap.md) | `specs/` | 迭代计划 |
| [AI 聊天后端审阅](changes/archive/ai-chat-review/review.md) | `specs/` | 一次性架构审阅 |
