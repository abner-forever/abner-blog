---
name: nestjs-rest-api-workflow
description: NestJS REST API 工作流。当开发/修改后端接口、DTO、Service、Controller，或进行接口联调时自动应用。强调接口合同管理、类型安全、Swagger 文档完整，以及接口变更后触发前端 API 重新生成。
---

# NestJS REST API 工作流

## 技术栈

| 技术 | 说明                                |
| ---- | ----------------------------------- |
| 框架 | NestJS 11                           |
| ORM  | TypeORM                             |
| 验证 | class-validator + class-transformer |
| 文档 | Swagger (@nestjs/swagger)           |
| 认证 | passport-jwt                        |

---

## 一、核心约束

- TypeScript 严格模式，**禁用 `any`**，用 `unknown` + 类型收窄
- **Controller 仅做参数接收与请求转发**，业务逻辑放 Service
- DTO 必须有 `class-validator` 装饰器
- 所有字段必须用 `@ApiProperty()` 标注，供 Swagger 文档生成
- **前后端类型一致性**：合同变更后在 **web** 执行 `pnpm generate:api`，**admin** 若消费同一 API 则另执行 `pnpm --filter @abner-blog/admin generate:api`；优先使用生成类型，**禁止用 `as` 规避或伪造响应结构**（见第八节）
- **禁止自动启动/重启后端项目**：完成后端代码修改后，不得自动执行 `pnpm run dev:server`、`pnpm run dev`、`nest start` 等启动命令；仅在用户明确要求时才可执行。

---

## 二、接口设计规范

### 2.1 路径规范

```
/api/{resource}              # 资源列表
/api/{resource}/:id           # 单个资源
/api/{resource}/:id/{action}  # 特定操作
```

### 2.2 HTTP 方法

| 方法   | 用途     | 示例                |
| ------ | -------- | ------------------- |
| GET    | 查询     | `GET /blogs`        |
| POST   | 创建     | `POST /blogs`       |
| PATCH  | 部分更新 | `PATCH /blogs/:id`  |
| PUT    | 完全替换 | `PUT /blogs/:id`    |
| DELETE | 删除     | `DELETE /blogs/:id` |

### 2.3 分页参数

统一使用 `page` / `pageSize`：

```typescript
page?: number = 1;      // 页码，从 1 开始
pageSize?: number = 10;  // 每页数量
```

### 2.4 认证要求

```typescript
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)        // 必须登录
@UseGuards(OptionalJwtAuthGuard) // 可选登录
```

---

## 三、DTO 规范

### 3.1 文件结构

```
src/{module}/dto/
├── create-{resource}.dto.ts   # 创建 DTO
├── update-{resource}.dto.ts   # 更新 DTO（所有字段可选）
├── search-{resource}.dto.ts   # 查询 DTO（分页+筛选）
└── {action}.dto.ts           # 特定操作 DTO
```

### 3.2 创建 DTO 示例

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBlogDto {
  @ApiProperty({ description: "博客标题", example: "我的第一篇博客" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "博客正文（Markdown）", example: "# 标题\n正文" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: [String], required: false, description: "标签列表" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
```

### 3.3 更新 DTO

```typescript
import { PartialType } from "@nestjs/swagger";
import { CreateBlogDto } from "./create-blog.dto";

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
```

### 3.4 查询 DTO

```typescript
import { IsOptional, IsInt, IsString } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class SearchBlogDto {
  @ApiProperty({ required: false, description: "搜索关键词" })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ required: false, description: "作者 ID" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  authorId?: number;
}
```

---

## 四、响应 DTO

### 4.1 文件结构

```
src/common/dto/responses/
├── {resource}.response.dto.ts
└── {resource}-list.response.dto.ts
```

### 4.2 响应 DTO 示例

```typescript
import { ApiProperty } from "@nestjs/swagger";

export class BlogAuthorDto {
  @ApiProperty({ description: "作者 ID", example: 1 })
  id: number;

  @ApiProperty({ description: "作者用户名", example: "abner" })
  username: string;

  @ApiProperty({ required: false, nullable: true, description: "作者昵称" })
  nickname: string | null;
}

export class BlogDto {
  @ApiProperty({ description: "博客 ID", example: 1 })
  id: number;

  @ApiProperty({ description: "博客标题" })
  title: string;

  @ApiProperty({ type: BlogAuthorDto, description: "作者信息" })
  author: BlogAuthorDto;

  @ApiProperty({ description: "创建时间" })
  createdAt: Date;
}

export class BlogListResponseDto {
  @ApiProperty({ type: [BlogDto], description: "博客列表" })
  list: BlogDto[];

  @ApiProperty({ description: "总数", example: 100 })
  total: number;

  @ApiProperty({ description: "当前页", example: 1 })
  page: number;

  @ApiProperty({ description: "每页数量", example: 10 })
  pageSize: number;
}
```

### 4.3 统一响应格式

通过 `TransformInterceptor` 统一封装：

```typescript
// 成功响应
{ data: T, message: string, timestamp: string }

// 分页响应
{ data: { list: T[], total, page, pageSize, totalPages }, message: string, timestamp: string }

// 错误响应
{ statusCode: number, message: string, timestamp: string, path: string }
```

---

## 五、Controller 规范

### 5.1 示例

```typescript
@ApiTags("blogs")
@Controller("blogs")
export class BlogsController {
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "创建博客" })
  @ApiResponse({ status: 201, type: BlogDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBlogDto, @Req() req: AuthenticatedRequest) {
    return this.blogsService.create(dto, req.user.userId);
  }

  @ApiOperation({ summary: "获取博客列表" })
  @ApiResponse({ status: 200, type: BlogListResponseDto })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() dto: SearchBlogDto) {
    return this.blogsService.findAll(dto);
  }
}
```

### 5.2 必须标注

- `@ApiTags()` - 接口分组
- `@ApiOperation({ summary })` - 接口描述
- `@ApiResponse()` - 响应类型
- `@ApiBearerAuth()` - 认证方式
- `@ApiQuery()` / `@ApiParam()` - 参数说明

---

## 六、实体规范

```typescript
@Entity()
@Index("idx_blog_author", ["author"])
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @Column("simple-array")
  tags: string[];

  @Column({ default: false })
  @Index()
  isPublished: boolean;

  @ManyToOne(() => User, (user) => user.blogs)
  @Index()
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 七、执行流程

### 7.1 新增接口

1. 定义接口合同（路径、方法、入参、出参）
2. 创建/更新 DTO（`@ApiProperty()` + `class-validator`）
3. 创建响应 DTO
4. 实现 Controller（标注 Swagger 装饰器）
5. 实现 Service（业务逻辑）
6. 创建实体（如有需要）
7. **执行 API 生成**（见第八节）
8. 验证：typecheck + lint

### 7.2 修改接口

1. 确认变更范围
2. 更新 DTO 字段和验证规则
3. 更新响应 DTO
4. 更新 Service
5. **执行 API 生成**
6. 验证兼容性
7. 验证：typecheck + lint

---

## 八、API 生成与前后端类型

### 8.1 生成命令（在仓库根目录）

```bash
# 用户站（与根 package.json 中 generate:api 一致，仅 @abner-blog/web）
pnpm generate:api

# 管理后台（接口变更若 admin 也需联调时必须执行）
pnpm --filter @abner-blog/admin generate:api
```

也可在对应应用目录内执行 `pnpm generate:api`（效果相同）。

### 8.2 触发时机

**任何接口合同变更后必须立即重新生成：**

- 新增/修改/删除接口
- DTO 字段变更（请求/响应）
- 枚举值变更
- 查询参数/路径参数变更

### 8.3 类型使用原则

**后端职责**：响应 DTO 必须用 `@ApiProperty()` 标注每个字段

**前端职责**：直接使用生成的类型，**禁止 `as` 断言**

```typescript
// ✅ 正确
import type { BlogDto } from "@services/generated/model";
const blog: BlogDto = response.data;

// ❌ 错误
const blog = response.data as unknown as BlogDto;
```

### 8.4 验证生成结果

生成后检查各前端应用下的 `src/services/generated/model/`（**web**、**admin** 路径相同、彼此独立）：

- 响应类型应为具体结构（如 `BlogDto`），而非 `{ [key: string]: unknown }`
- 若仍为泛型对象，说明后端响应 DTO 缺少 `@ApiProperty()`

### 8.5 Orval 前端生成对齐：operationId、schema 与 Params/Response 命名

前端（**web** / **admin**）由 Orval 根据 OpenAPI 生成客户端。后端在 Swagger 中的命名会**直接落地**为前端的函数名与类型名，宜保持稳定、可读。

| Swagger / 代码侧 | 前端生成物（典型） | 说明 |
| ---------------- | ------------------ | ---- |
| **operationId**（或 Nest 默认推导的操作 id） | `getWeather`、`createBlog` 等 `camelCase` 函数；Query hook 为 `use` + PascalCase，如 `useGetWeather` | 需稳定 API 表面时，可在 `@ApiOperation({ operationId: 'getWeather' })` 显式指定 |
| Query + Path + Header 等参数 schema | `{Method}{OperationId}Params`，如 `GetWeatherParams` | 来自合并后的参数对象；字段说明用 `@ApiProperty({ description })`，会进生成的 JSDoc |
| 响应 body 的 **component schema 名**（通常即 DTO 类名） | 如 `WeatherInfoResponse`、`BlogDto` | 类名 PascalCase；经 `httpMutator` 解包后即为 Promise 泛型 `T` |
| **@ApiTags** | 输出文件目录，如 `generated/weather/weather.ts` | `tags-split` 下一 tag 一个文件 |

**示例（与 `apps/web/src/services/generated/weather/weather.ts` 一致）：**

- Controller 方法对应某 `operationId` → 生成 `export const getWeather = (params?: GetWeatherParams, signal?: AbortSignal) => httpMutator<WeatherInfoResponse>({ ... })`。
- 查询 DTO 字段 → `GetWeatherParams` 的可选属性与注释。
- `@ApiResponse({ type: WeatherInfoResponseDto })` 且 DTO 全类名映射到文档 → 前端 `WeatherInfoResponse`（具体以 OpenAPI 中的 schema 名为准）。

变更接口时：先保证 Swagger 中 operationId/schema **有意图地命名**，再执行 `pnpm generate:api`，避免前端大面积重命名。

---

## 九、检查清单

### DTO 检查

- [ ] 每个字段都有 `@ApiProperty()`
- [ ] 必填字段有 `@IsNotEmpty()` / `@IsDefined()`
- [ ] 可选字段有 `@IsOptional()`
- [ ] 字符串字段有 `@IsString()`
- [ ] 数字字段有 `@IsInt()` / `@IsNumber()`
- [ ] 数组字段有 `@IsArray()` + `{ each: true }`

### Controller 检查

- [ ] 有 `@ApiTags()`
- [ ] 每个方法有 `@ApiOperation({ summary })`
- [ ] 每个方法有 `@ApiResponse()`
- [ ] 需要认证的接口有 `@ApiBearerAuth('JWT')`

### API 生成检查

- [ ] **web** 已执行 `pnpm generate:api`；**admin** 若调用变更接口则已执行 `pnpm --filter @abner-blog/admin generate:api`
- [ ] 生成的类型不是 `{ [key: string]: unknown }`
- [ ] 若重命名了对外 API 表面：已确认 `operationId` / 响应 DTO schema 名对 Orval 生成函数与类型名的影响（见 8.5）

---

## 十、输出格式

```markdown
完成：[模块/接口名]

- 变更：
  - Controller: [说明]
  - Service: [说明]
  - DTO: [说明]
  - 实体: [说明]
- API 生成：web `pnpm generate:api`；admin（如需要）`pnpm --filter @abner-blog/admin generate:api`
- 验证：typecheck / lint [通过/未跑]
```

---

## 参考

- 仓库根目录 `CLAUDE.md`（端口、脚本、响应格式、Git 约定）
