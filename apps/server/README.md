# ABNER Blog — 后端（`apps/server`）

**NestJS 11** REST API，含 **TypeORM**、**JWT**、**Swagger**、**WebSocket（Socket.IO）** 等。默认端口 **8080**，API 前缀一般为 `/api`。

- 环境变量模板：[`.env.example`](./.env.example)
- 更完整的仓库级命令与结构：[根目录 `README.md`](../../README.md)

## 技术栈（节选）

| 技术 | 说明 |
| ---- | ---- |
| NestJS / TypeScript | 应用框架 |
| TypeORM | ORM（MySQL / PostgreSQL 等） |
| ioredis | Redis（可选） |
| Passport + JWT | 认证 |
| class-validator | DTO 校验 |
| Multer | 文件上传 |
| Socket.IO | 实时通信 |
| Swagger | OpenAPI 文档 |

## 环境与启动

```bash
cd apps/server
cp .env.example .env   # 填写数据库、JWT、Redis 等
pnpm run dev           # nest start --watch
```

本地访问：**API** `http://localhost:8080/api`，**Swagger** `http://localhost:8080/api-docs`，静态上传路径视配置而定（如 `/uploads`）。

## 数据模型

### ER 关系图

```
┌─────────────┐
│    User     │
│  (用户表)   │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌─────────┐  ┌─────────┐
│  Blog   │  │  Todo   │
│(博客表) │  │(待办表) │
└────┬────┘  └────────┘
     │
     ├──────┬──────┬──────┐
     ▼      ▼      ▼      ▼
┌────────┐ ┌────┐ ┌────────┐
│Comment │ │Like│ │Favorite│
│(评论表)│ │(点赞)│ │(收藏表)│
└────────┘ └────┘ └────────┘
```

### 实体说明

#### User（用户）

- `id`: 主键
- `username`: 用户名（唯一）
- `email`: 邮箱（唯一）
- `password`: 密码（加密存储）
- `avatar`: 头像 URL
- `status`: 账户状态
- `loginFailureCount`: 登录失败次数
- `lastLoginAt`: 最后登录时间
- `createdAt` / `updatedAt`

#### Blog（博客）

- `id`: 主键
- `title` / `content` / `summary`
- `tags`: 标签数组
- `isPublished` / `viewCount`
- `author`: 关联 User
- `createdAt` / `updatedAt`

#### Comment（评论）

- `id` / `content` / `author` / `blog` / `createdAt`

#### Like（点赞）

- `id` / `user` / `blog` / `createdAt`

#### Favorite（收藏）

- `id` / `user` / `blog` / `createdAt`

#### Todo（待办事项）

- `id` / `title` / `completed` / `user` / `createdAt`

---

## API 文档

### 基础信息

- **Base URL**: `http://localhost:8080/api`
- **OpenAPI / Swagger**: `http://localhost:8080/api-docs`（以 Swagger 为准）
- **认证**: JWT Bearer Token
- **请求**: `application/json`（上传等为 `multipart/form-data`）
- **响应**: 经 `TransformInterceptor` 统一包装（见下）

### 统一响应格式

#### 成功

```json
{
  "success": true,
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": "2026/4/5 12:00:00"
}
```

#### 错误

```json
{
  "success": false,
  "code": 400,
  "message": "错误信息",
  "data": null,
  "timestamp": "2026/4/5 12:00:00"
}
```

### 认证接口

#### 注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

若启用腾讯云验证码等，登录请求需按 DTO 携带票据字段（见 Swagger）。

**响应示例**（`data` 内为登录结果）：

```json
{
  "success": true,
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "abner",
      "email": "user@example.com",
      "avatar": null
    }
  },
  "timestamp": "2026/4/5 12:00:00"
}
```

#### 获取个人信息

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 更新个人信息

```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "string",
  "avatar": "string"
}
```

### 博客接口

#### 列表

```http
GET /api/blogs?page=1&pageSize=10&search=keyword&tag=tag1&authorId=1
```

查询参数（节选，完整见 Swagger）：`page`、`pageSize`、`search`、`tag`、`authorId`，以及 `isAuthor`、`sortBy` 等。

#### 详情 / 创建 / 更新 / 删除

```http
GET /api/blogs/:id
POST /api/blogs
PATCH /api/blogs/:id
DELETE /api/blogs/:id
```

创建示例：

```http
POST /api/blogs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string",
  "summary": "string",
  "tags": ["tag1", "tag2"],
  "isPublished": true
}
```

### 点赞

```http
POST /api/blogs/:id/likes
Authorization: Bearer <token>

GET /api/blogs/:id/likes/count
GET /api/blogs/:id/likes/status
Authorization: Bearer <token>
```

### 收藏

```http
POST /api/blogs/:id/favorites
Authorization: Bearer <token>

GET /api/favorites
Authorization: Bearer <token>
```

### 待办

```http
GET /api/todos
POST /api/todos
PUT /api/todos/:id
DELETE /api/todos/:id
Authorization: Bearer <token>
```

### 文件上传接口

```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**响应示例**（若与拦截器包装并存，以实际 Swagger / 网络响应为准）：

```json
{
  "url": "/uploads/1234567890-filename.jpg"
}
```

前端分片上传工具包见 [`packages/upload`](../../packages/upload/README.md)。

---

## 测试

### 在仓库根目录（推荐）

```bash
pnpm run test:unit
pnpm run test:e2e:server
pnpm run check:ci
```

### 在本目录

```bash
pnpm run test
pnpm run test:cov
pnpm run test:watch
pnpm run test:e2e
```

覆盖率历史可参考 `TEST_REPORT.md`（以当前 `pnpm run test:cov` 输出为准）。

| 模块（历史参考） | 语句 | 分支 | 函数 | 行 |
| ---------------- | ---- | ---- | ---- | -- |
| AuthService | 100% | 100% | 100% | 100% |
| UsersService | 100% | 100% | 100% | 100% |
| BlogsService | 100% | 71.42% | 100% | 100% |

---

## 脚本

```bash
pnpm run dev           # nest start --watch
pnpm run start         # nest start
pnpm run start:prod    # node dist/main
pnpm run start:debug
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:cov
pnpm run test:e2e
```

---

## 架构说明

### 认证

- **本地策略**（`passport-local`）：用户名密码
- **JWT 策略**（`passport-jwt`）：Token
- **可选认证**：未登录也可访问部分接口
- **守卫**：`LocalAuthGuard`、`JwtAuthGuard`、`OptionalJwtAuthGuard`

### 拦截器

- **LoggingInterceptor**：请求 / 响应日志，过滤敏感字段
- **TransformInterceptor**：统一成功响应结构与时间戳

### 异常与校验

- **HttpExceptionFilter**：统一错误响应
- **class-validator** + **class-transformer**：DTO 校验与转换

---

## 部署

```bash
cd apps/server
pnpm run build
pnpm run start:prod
```

生产环境变量参考 `.env.example`。仓库根目录 `scripts/` 下另有部署辅助脚本；CI 见 `.github/workflows/`。

---

## 扩展模块（Nest CLI）

```bash
cd apps/server
nest g module feature-name
nest g controller feature-name
nest g service feature-name
```

接口变更后请在 `apps/web`（及需要的 `apps/admin`）执行 `pnpm run generate:api` 同步 Orval 客户端。
