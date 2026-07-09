# 项目约定

> 项目级约定文件，供 OpenSpec 工具和 AI 在创建/更新规范时作为上下文参考。

## 技术栈

### 后端 (apps/server)

- **框架**: NestJS 11 + TypeScript
- **ORM**: TypeORM + MySQL（42+ 实体）
- **认证**: JWT (passport-jwt) + Keycloak SSO (OIDC + PKCE)
- **AI**: LangChain + LangGraph（意图检测、命令路由、流式输出）
- **MCP**: @modelcontextprotocol/sdk（内置工具 + 远程服务器管理）
- **缓存**: Redis
- **API 风格**: RESTful，统一响应 `{ data, message, timestamp }`
- **日志**: RootFileLogger + LoggingInterceptor
- **WebSocket**: @nestjs/websockets（实时私信、通知推送）

### 前端（web / admin / chat / editor）

- **框架**: React 18 + TypeScript
- **构建**: Vite 8
- **UI 库**: Ant Design 6
- **样式**: LESS + BEM 命名
- **服务端状态**: TanStack Query
- **全局状态**: Redux Toolkit（auth、theme）
- **国际化**: react-i18next（中文/英文/繁体）
- **路径别名**: `@/` → `src/`、`@components/`、`@services/`、`@store/`、`@hooks/`

### 基础设施

- **包管理**: pnpm monorepo
- **端口**: server 8080, web 3000, admin 3001, chat 3002, editor 5175
- **Docker**: MySQL + Redis（`pnpm run dev:services`）

## API 规范

### 响应格式

```typescript
// 成功
{ data: T, message: string, timestamp: string }

// 分页列表
{ list: T[], total: number, page: number, pageSize: number, totalPages: number }

// 错误
{ statusCode: number, message: string, timestamp: string, path: string }
```

### 认证

- **JWT**: `Authorization: Bearer <token>`，守卫 `JwtAuthGuard`
- **可选认证**: `OptionalJwtAuthGuard`（登录/未登录皆可访问）
- **SSO**: 跳转 `/api/sso/authorize` → Keycloak → 回调 `/api/sso/callback`
- **Admin 守卫**: 验证用户角色为 admin

### 分页

查询参数 `page` / `pageSize` （默认 page=1, pageSize=10）

## 前端编码约定

- API 调用**必须**通过 `@services/http.ts`（封装 axios 实例），禁止直接使用 axios
- 所有用户可见文本**必须**使用 `useTranslation()` hook
- 组件超过 200 行需拆分，大型页面使用懒加载
- 危险操作**必须**使用 `Popconfirm` 二次确认
- **禁止**: `any` 类型、硬编码颜色值、硬编码 API URL、硬编码用户文本
- **必须处理**: Loading 状态（Spin/Skeleton）、空状态（CustomEmpty）、错误状态

### 样式

- 使用 LESS 变量，禁止硬编码颜色
- 覆盖 antd 样式时优先使用**上下文限定选择器**（`.page-container .custom-input`）
- `!important` 仅用于对抗 antd 全局 `!important`，且需注释说明原因
- BEM 命名：`.模块__元素--修饰符`
- LESS 嵌套不超过 3 层

## 数据库

- MySQL + TypeORM，实体位于 `apps/server/src/entities/`
- 核心实体关系见 CLAUDE.md

## Git

- 提交格式：`feat(module): description`、`fix(module): description`
- 使用 `pnpm run commit` 交互式提交（Commitizen）
- Pre-commit: lint | Commit-msg: conventional commit 格式验证
