# ABNER Blog — 用户站（`apps/web`）

基于 **React 18 + Vite 6 + Ant Design 6 + Redux Toolkit + TanStack Query** 的博客用户端。

- 开发端口见 [`vite.config.ts`](./vite.config.ts)（默认 **3000**）。
- HTTP 与 API 封装见 `src/services/`；服务端数据优先使用 TanStack Query，全局状态见 `src/store/`。

## 技术栈（节选）

| 技术 | 说明 |
| ---- | ---- |
| React / TypeScript / Vite | 应用基础 |
| React Router | 路由 |
| Redux Toolkit | 全局状态（auth、theme 等） |
| TanStack Query | 服务端状态与请求 |
| Ant Design / LESS | UI 与样式 |
| i18next | 国际化 |
| md-editor-rt / react-markdown | Markdown 编辑与渲染 |
| Axios | HTTP（经项目统一封装） |
| Orval | 由 OpenAPI 生成 API 客户端 |
| Vitest / Playwright | 单元 / E2E 测试 |

## 脚本

```bash
cd apps/web

pnpm run dev
pnpm run build
pnpm run preview
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:e2e
pnpm run generate:api
```

## 主要路由

| 路径 | 说明 | 权限 |
| ---- | ---- | ---- |
| `/` | 首页 | 公开 |
| `/blogs` | 博客列表 | 公开 |
| `/blogs/:id` | 博客详情 | 公开 |
| `/blogs/:id/edit` | 编辑博客 | 登录 |
| `/create` | 发布博客 | 登录 |
| `/favorites` | 我的收藏 | 登录 |
| `/todos` | 待办 | 登录 |
| `/notes`、`/notes/create`、`/notes/:id` | 笔记 | 依页面 |
| `/moments` | 动态流 | 公开 |
| `/chat` | 聊天 | 公开 |
| `/messages` | 私信 | 登录 |
| `/notifications` | 通知 | 登录 |
| `/news`、`/tools`、`/about`、`/interview`、`/search` | 资讯 / 工具 / 关于等 | 公开 |
| `/user/:id` | 用户主页 | 公开 |
| `/profile`、`/profile/edit` | 个人资料 | 登录 |
| `/login`、`/register`、`/forgot-password`、`/reset-password` | 认证相关 | 公开 |

完整列表以 `src/routes/index.tsx` 中的 `routeConfig` 为准。

## 测试

在仓库根目录（推荐）：

```bash
pnpm run test:unit
pnpm run test:e2e:web
pnpm run check:ci
```

在本目录：

```bash
pnpm run test        # Vitest
pnpm run test:e2e    # Playwright
```

## 上传与共享包

文件 / 分片上传相关逻辑可使用工作区包 [`@abner-blog/upload`](../../packages/upload/README.md)。

## 相关文档

- 仓库总览：[根目录 `README.md`](../../README.md)
- 开发约定：[根目录 `CLAUDE.md`](../../CLAUDE.md)
- 后端 API：`apps/server`（[`README.md`](../server/README.md)）
