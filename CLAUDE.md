# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

基于 **pnpm monorepo** 架构的全栈博客系统，包含三个应用：

| 应用            | 技术栈                                                            | 端口 |
| --------------- | ----------------------------------------------------------------- | ---- |
| `apps/server` | NestJS 11 + TypeORM + MySQL + Redis + JWT（服务端）                 | 8080 |
| `apps/web` | React 18 + Vite 6 + Ant Design 6 + Redux Toolkit + TanStack Query（用户站） | 5173 |
| `apps/admin`    | React 18 + Vite 6 + Ant Design 6（管理后台）                      | 5174 |

## 常用命令

```bash
# 开发
pnpm run dev              # 并行启动前端 + 后端
pnpm run dev:server       # 仅启动后端 (nest start --watch)
pnpm run dev:web          # 仅启动前端
pnpm run dev:admin        # 启动管理后台

# 构建
pnpm run build            # 构建所有项目
pnpm run build:server     # 仅构建后端
pnpm run build:web        # 仅构建前端

# 质量检查
pnpm run lint             # 对所有项目运行 ESLint
pnpm run typecheck        # 运行 TypeScript 类型检查
pnpm run test:unit        # 运行单元测试（后端 jest + 前端 vitest）
pnpm run check:ci         # lint + typecheck + test:unit（提交前运行）

# E2E 测试
pnpm run test:e2e:server # 后端 e2e 测试
pnpm run test:e2e:web # 前端 e2e 测试 (Playwright)

# API 代码生成
pnpm run generate:api     # 从 OpenAPI 规范生成 API 客户端 (orval)
```

## 架构

### Monorepo 结构

```
apps/
├── server/           # NestJS 服务端（REST API）
│   └── src/
│       ├── auth/     # JWT 认证 (passport-jwt)
│       ├── blogs/    # 博客 CRUD，含标签、分页
│       ├── comments/ # 评论系统
│       ├── users/    # 用户管理
│       ├── entities/ # TypeORM 实体
│       ├── common/   # Guards、Interceptors、Filters
│       └── config/   # 配置
├── web/              # 用户端 React 应用
│   └── src/
│       ├── pages/    # 页面组件（按路由组织）
│       ├── components/ # 共享组件
│       ├── services/ # API 层 (http.ts + api.ts)
│       ├── store/    # Redux slices (auth, theme)
│       └── hooks/    # 自定义 hooks
└── admin/            # 管理后台（结构与 web 类似）

packages/
└── utils/            # 共享工具库
```

### 后端模式

- **认证**：JWT + `passport-jwt`，守卫：`JwtAuthGuard`、`OptionalJwtAuthGuard`
- **验证**：DTO 使用 `class-validator` 装饰器
- **响应**：通过 `TransformInterceptor` 统一格式 - `{ data, message, timestamp }`
- **错误处理**：全局 `HttpExceptionFilter`
- **数据库**：TypeORM + MySQL/PostgreSQL，实体位于 `src/entities/`

### 前端模式

- **路径别名**：使用 `@/`、`@components/`、`@services/`、`@store/`、`@hooks/`（tsconfig 配置）
- **API 调用**：统一通过 `@services/api.ts`，禁止直接使用 axios
- **状态管理**：
  - 全局应用状态 → Redux Toolkit（auth、theme）
  - 服务端数据 → TanStack Query（blogs、comments）
  - URL 状态 → `useSearchParams`
- **样式**：LESS + BEM 命名，全局变量在 `styles/variables.less`（自动注入）
- **国际化**：所有用户可见文本必须使用 `useTranslation()` hook

## 开发规范

### 后端 (NestJS)

详细文档：`docs/DEVELOPMENT_NESTJS.md`

- Controller 保持轻量（仅路由），Service 处理业务逻辑
- 所有请求/响应使用 DTO + `class-validator`
- API 路径遵循 REST 风格：`/api/resource`
- 分页参数：`page` / `pageSize`

### 前端 (React)

详细文档：`docs/DEVELOPMENT_REACT.md`

- **组件文件结构**：React imports → 内部 imports → 类型定义 → 组件实现 → export
- **禁止**：`any` 类型、硬编码颜色、硬编码 API URL、硬编码用户文本
- **必须**：Loading 状态（Spin/Skeleton）、空状态（CustomEmpty）、错误处理、所有文本国际化
- **危险操作**：必须使用 `Popconfirm` 二次确认
- **大型组件**：超过 200 行需拆分，页面使用懒加载

### 样式规范 (CSS/LESS)

#### 优先级规则（避免 `!important`）

**优先级从高到低**：内联 style → ID 选择器 → 类/伪类/属性选择器 → 元素/伪元素选择器 → 通配符

**覆盖 antd 等第三方库全局样式**的正确方式（按优先级从高到低）：

1. **使用原生 HTML 元素**（绕过第三方类名）

   ```tsx
   // ✅ 好：原生 input 不受 .ant-input 影响
   <input className="title-input" />

   // ❌ 差：antd Input 受全局 !important 约束
   <Input className="title-input" />
   ```

2. **使用更高优先级的选择器**（推荐）

   ```less
   // ✅ 好：上下文限定提高优先级
   .page-container {
     .custom-input {
       background: var(--bg-color); // 可覆盖全局 .ant-input !important
     }
   }

   // ❌ 差：直接用低优先级类名
   .custom-input {
     background: var(--bg-color); // 无法覆盖 .ant-input !important
   }
   ```

3. **增加选择器数量**

   ```less
   // ✅ 好：两个类选择器叠加，优先级高于单个类
   .sidebar .summary-textarea.ant-input-textarea {
     ...;
   }
   ```

4. **必要时使用 `!important`**（最后手段）
   - 仅用于覆盖第三方库（如 antd）的全局 `!important` 样式
   - 在该场景下，使用 `!important` 是合理的，但需添加注释说明原因
   ```less
   // 覆盖 antd 全局 .ant-input !important（第三方库强制样式）
   .juejin-editor__sidebar .summary-textarea {
     background: var(--bg-color) !important;
   }
   ```

#### 其他规范

- **禁止**硬编码颜色值，必须使用 LESS/CSS 变量
- **BEM 命名**：`.模块__元素--修饰符`
- **嵌套限制**：LESS 嵌套不超过 3 层
- **变量文件**：`src/styles/variables.less` 定义全局变量（自动注入）
- **组件样式**：优先放在组件目录下 `index.less`，而非全局文件

## API 响应格式

```typescript
// 成功
{ data: T, message: string, timestamp: string }

// 分页列表
{ list: T[], total: number, page: number, pageSize: number, totalPages: number }

// 错误
{ statusCode: number, message: string, timestamp: string, path: string }
```

## 数据库

MySQL + TypeORM。核心实体关系：

- `User` → `Blog` (1:N) → `Comment`、`Like`、`Favorite`
- `User` → `Todo` (1:N)
- `Blog` → `tags`（字符串数组）

## Git 工作流

- 提交格式：`feat(module): description`、`fix(module): description`
- 使用 `pnpm run commit` 进行交互式提交（Commitizen）
- Pre-commit 钩子：lint 检查
- Commit-msg 钩子：约定式提交格式验证
