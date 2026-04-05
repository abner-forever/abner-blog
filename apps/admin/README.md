# ABNER Blog — 管理后台（`apps/admin`）

基于 **React 18 + Vite 6 + Ant Design 6** 的运营与内容管理端，与用户站（`apps/web`）共享 monorepo 工作流。

- 开发端口见 [`vite.config.ts`](./vite.config.ts)（默认 **3001**）。
- API 客户端可通过 Orval 从后端 OpenAPI 生成，配置与脚本与用户站类似。

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
