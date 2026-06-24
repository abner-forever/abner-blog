# ABNER Blog — 低代码页面编辑器（`apps/editor`）

基于 **React 18 + Vite 8 + GrapesJS Studio SDK** 的可视化页面编辑器。

- 开发端口：**5175**（见 [`vite.config.ts`](./vite.config.ts)）
- 使用 GrapesJS Studio SDK 进行可视化页面编辑
- 支持页面管理、版本历史、审核、回收站等功能

## 技术栈

| 技术 | 说明 |
| ---- | ---- |
| React / TypeScript / Vite | 应用基础 |
| GrapesJS Studio SDK | 可视化页面编辑器 |
| Redux Toolkit | 全局状态管理 |
| Ant Design / LESS | UI 与样式 |
| react-router-dom | 路由 |
| @abner-blog/page-schema | 页面 Schema 渲染引擎 |
| @abner-blog/shared-ui | 共享 UI 组件 |

## 脚本

```bash
cd apps/editor

pnpm run dev          # 启动开发服务器
pnpm run build        # 构建生产版本
pnpm run lint         # ESLint 检查
pnpm run typecheck    # TypeScript 类型检查
pnpm run preview      # 预览构建结果
```

## 主要页面

| 页面 | 说明 |
| ---- | ---- |
| HomeDashboard | 编辑器首页仪表盘 |
| PageEditor | GrapesJS 可视化编辑器 |
| PageList | 页面列表管理 |
| PagePreview | 页面预览 |
| VersionList | 版本历史 |
| ReviewList | 审核列表 |
| TrashList | 回收站 |

## 相关文档

- 仓库总览：[根目录 `README.md`](../../README.md)
- 开发约定：[根目录 `CLAUDE.md`](../../CLAUDE.md)
- 后端 API：`apps/server`（[`README.md`](../server/README.md)）
- 页面 Schema 引擎：[`packages/page-schema`](../../packages/page-schema/README.md)
