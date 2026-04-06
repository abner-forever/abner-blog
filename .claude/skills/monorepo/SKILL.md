---
name: monorepo
description: pnpm monorepo 全局规则。判定改动边界、目录落点、质量门禁与接口联动；覆盖 apps/web、apps/admin、apps/server、packages/*。
---

# Monorepo

## 何时使用

- 任意代码改动（用户站 / 管理后台 / 后端 / 共享包）
- 新增页面、模块、共享代码、路由或 API
- 判断文件应落在哪个应用或包内

## 仓库结构（必须）

| 路径 | 说明 |
| ---- | ---- |
| `apps/web` | 用户站 React + Vite（默认 5173） |
| `apps/admin` | 管理后台 React + Vite（默认 5174） |
| `apps/server` | NestJS 11 API（默认 8080） |
| `packages/*` | 共享包（如 `@abner-blog/utils`、`@abner-blog/upload`） |

- **禁止** `apps/*` 之间通过源码互相 import（不建立应用间源码耦合）
- 前端引用使用**各自应用** `tsconfig.app.json` 中的路径别名；**web** 含 `@components/*`、`@services/*` 等扩展别名；**禁止**深层相对路径 `../../../`
- 跨应用复用的库代码放在 `packages/*`，在 `package.json` 中用 `workspace:*` 引用

## 前端规则（最小集）

- 页面与组件按模块分目录；样式用 LESS（常见为同目录 `index.less`）；路由页面**懒加载**
- API：**优先** Orval 产物 `src/services/generated/*`
  - 根目录 `pnpm generate:api` 仅更新 **`@abner-blog/web`**
  - **admin** 需单独执行：`pnpm --filter @abner-blog/admin generate:api`
  - 生成物的**函数名**随 OpenAPI `operationId`（或 Nest 默认 id），**入参类型**多为 `{Method}{OperationId}Params`，**返回类型**为 Swagger schema 名（如 `WeatherInfoResponse`）；Query 相关符号（`useXxx`、`getGetXxxQueryKey`）由 Orval 自动生成，业务代码勿手改 `generated/**`，消费约定见 **react-dev** skill「5.5 Orval 自动生成接口」
- `@services/api.ts` 等手写层仅作兼容薄封装；新接口优先接生成客户端
- 禁止在页面/组件内直调 axios/fetch（须经过统一 HTTP 封装）

## 后端规则（最小集）

- 模块：`controller` + `service` + `module` + `dto`
- DTO：`class-validator`；Swagger `@ApiProperty()` 与 `TransformInterceptor` 响应约定一致
- Controller 轻量，业务在 Service

## 新增 / 重构策略（必须）

- 优先增量扩展，少动既有行为
- 必须重构时先评估调用链、接口、数据、页面、兼容性
- 禁止无关重构与无关文件改动

## 质量与测试（必须）

- 禁用 `any`（必要时 `unknown` + 收窄）
- 改动模块补/更新对应测试并实际执行
- 提交前建议：`pnpm run check:ci`（根目录 lint + typecheck + test:unit，含 web / server / admin）

## 接口变更联动（必须）

- 后端合同（路径、方法、DTO、响应）变更后：
  - **web**：`pnpm generate:api`
  - **admin** 若也消费该 API：`pnpm --filter @abner-blog/admin generate:api`
- 前端改用生成类型与客户端，淘汰过时手写类型
- 生成结果与实现不一致时，优先修后端 DTO / `@ApiProperty()`，再重新生成

## 常用命令（仓库根目录）

```bash
pnpm run dev              # web + server 并行
pnpm run dev:web     # 仅 web
pnpm run dev:admin        # 仅 admin
pnpm run dev:server      # 仅 server
pnpm run build
pnpm run check:ci
pnpm generate:api         # 仅 @abner-blog/web
pnpm --filter @abner-blog/admin generate:api
pnpm run test:e2e:web
pnpm run test:e2e:server
```

## 参考

- 技术栈、脚本与约定以仓库根目录 **`CLAUDE.md`** 为准
