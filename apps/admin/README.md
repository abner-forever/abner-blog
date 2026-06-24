# ABNER Blog — 管理后台（`apps/admin`）

基于 **React 18 + Vite 6 + Ant Design 6 + ECharts** 的运营与内容管理端，与用户站（`apps/web`）共享 monorepo 工作流。

- 开发端口见 [`vite.config.ts`](./vite.config.ts)（默认 **3001**）。
- API 客户端可通过 Orval 从后端 OpenAPI 生成，配置与脚本与用户站类似。

## 技术栈

| 技术 | 说明 |
| ---- | ---- |
| React / TypeScript / Vite | 应用基础 |
| React Router | 路由 |
| Redux Toolkit | 全局状态（auth、theme 等） |
| TanStack Query | 服务端状态与请求 |
| Ant Design / LESS | UI 与样式 |
| i18next | 国际化 |
| ECharts | 数据可视化 |
| Orval | 由 OpenAPI 生成 API 客户端 |
| @abner-blog/shared-ui | 共享 UI 组件 |
| @abner/analytics | 埋点 SDK |

## 脚本

```bash
cd apps/admin

pnpm run dev           # 开发
pnpm run build         # 生产构建，产物 `dist/`
pnpm run preview       # 预览构建结果
pnpm run lint
pnpm run typecheck
pnpm run generate:api  # 同步 OpenAPI → 客户端（视项目配置而定）
```

## 相关文档

- 仓库总览与根目录命令：[根目录 `README.md`](../../README.md)
- 开发约定：[根目录 `CLAUDE.md`](../../CLAUDE.md)
- 后端接口与 Swagger：`apps/server`（见该目录 [`README.md`](../server/README.md)）
