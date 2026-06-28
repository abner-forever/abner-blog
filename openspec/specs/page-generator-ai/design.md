# Page Generator AI — 技术设计

> 基于访谈决策的完整技术设计方案

## 1. 整体架构

```
┌─────────────────────────────────────────────────────┐
│                  前端 (apps/editor)                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │  /editor/ai-create                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ 步骤1    │→│ 步骤2    │→│ 步骤3        │  │ │
│  │  │ 风格选择  │  │ 对话描述  │  │ 流式预览+迭代 │  │ │
│  │  └──────────┘  └──────────┘  └──────┬───────┘  │ │
│  │                                      │          │ │
│  │  ┌──────────────────────────────────┐│          │ │
│  │  │ SSE EventSource                  ││          │ │
│  │  │ ← region_start/region_component  ││          │ │
│  │  │ ← region_end/complete/error      ││          │ │
│  │  └──────────────────────────────────┘│          │ │
│  │                                      ▼          │ │
│  │  ┌──────────────────────────────────────────┐   │ │
│  │  │ schemaToHtml.ts (PageSchema → HTML)       │   │ │
│  │  └──────────────────────────────────────────┘   │ │
│  │                                      │          │ │
│  │                                      ▼          │ │
│  │  ┌──────────────────────────────────────────┐   │ │
│  │  │ GrapesJS StudioEditor (编辑微调)          │   │ │
│  │  └──────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           │ HTTP/SSE
                           ▼
┌─────────────────────────────────────────────────────┐
│              后端 (apps/server)                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  page-generator/                                │ │
│  │  ┌─────────────────┐  ┌──────────────────────┐  │ │
│  │  │ PageGeneratorCtrl │→│ PageGeneratorService  │  │ │
│  │  │ POST /generate    │  │  ┌────────────────┐ │  │ │
│  │  │ POST /modify      │  │  │ LLM Orchestrator│ │  │ │
│  │  │ POST /config      │  │  │ (DeepSeek/     │ │  │ │
│  │  └─────────────────┘  │  │  │ OpenAI/Anthropic│ │  │ │
│  │                       │  │  └────────────────┘ │  │ │
│  │                       │  │  ┌────────────────┐ │  │ │
│  │                       │  │  │ Region Planner  │ │  │ │
│  │  ┌─────────────────┐  │  │  │ (区域规划引擎)   │ │  │ │
│  │  │ SSE StreamEmitter│ │  │  └────────────────┘ │  │ │
│  │  │ (SSE 事件推送)    │  │  └──────────────────────┘  │ │
│  │  └─────────────────┘  │                             │ │
│  │  ┌─────────────────┐  │                             │ │
│  │  │ DTO / Entities   │  │  ┌──────────────────────┐  │ │
│  │  │ - AiGeneration   │  │  │ PageGeneratorConfig   │  │ │
│  │  │ - PageGeneratorCfg│  │  │ (API Key 管理)        │  │ │
│  │  └─────────────────┘  │  └──────────────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  pages/ (现有模块)                                │ │
│  │  - Page CRUD                                     │ │
│  │  - PageVersion 管理                               │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 2. 核心数据流

### 2.1 首次生成流程

```
用户描述 → [前端] POST /api/page-generator/generate
  → [后端] 接收请求，创建 AiGenerationTask 记录
  → [后端] 加载用户 LLM 配置
  → [后端] 构建 System Prompt（组件元数据 + 区域定义 + 主题 Token）
  → [后端] 构建 User Prompt（用户描述 + 风格选择）
  → [后端] LLM 调用：规划页面 → 返回区域列表
  → [后端] 循环每个区域：
      1. LLM 生成该区域的 SchemaNode 子树
      2. region_start → SSE 推送
      3. 组件级流式输出 → region_component → SSE 推送
      4. region_end（完整 region schema）→ SSE 推送
  → [后端] complete（完整 PageSchema）→ SSE 推送
  → [前端] 完整渲染预览

用户确认 → [前端] POST /api/page-generator/confirm
  → [后端] 调用 pages API 创建 Page 记录
  → [后端] 返回 page slug
  → [前端] 跳转到 /editor/{slug}
  → [前端] schemaToHtml() 转换 → 载入 GrapesJS
```

### 2.2 对话迭代流程

```
用户修改描述 → [前端] POST /api/page-generator/modify
  → [后端] 接收：{ description, currentSchema }
  → [后端] LLM 分析变更（可以按区域修改或全局修改）
  → [后端] 返回增量变更或完整替换
  → [后端] 按受影响区域推送 SSE 事件
  → [前端] 更新对应区域渲染
```

### 2.3 SSE 协议定义

```typescript
// 事件类型
type SSEEventType =
  | 'region_start'    // 区域开始生成
  | 'region_component'// 区域内单个组件
  | 'region_end'      // 区域生成完成
  | 'complete'        // 所有区域生成完成
  | 'error';          // 错误

// region_start payload
interface RegionStartEvent {
  regionId: string;      // 唯一标识，如 "hero"
  regionType: string;    // 区域类型，如 "hero" | "features" | "footer"
  name: string;          // 中文名称，如 "主视觉区域"
}

// region_component payload
interface RegionComponentEvent {
  regionId: string;
  componentType: string; // SchemaNode type，如 "text" | "button"
  props: Record<string, unknown>; // 该组件的 props
}

// region_end payload
interface RegionEndEvent {
  regionId: string;
  schema: SchemaNode;    // 该区域的完整 SchemaNode 子树
}

// complete payload
interface CompleteEvent {
  pageSchema: PageSchema;
  regions: Array<{
    regionId: string;
    regionType: string;
    name: string;
  }>;
}

// error payload
interface ErrorEvent {
  regionId?: string;     // 如果为空，表示全局错误
  message: string;
  retryable: boolean;
}
```

## 3. API 端点设计

### 3.1 页面生成

```typescript
POST /api/page-generator/generate
Content-Type: application/json
Accept: text/event-stream  // SSE

Request Body:
{
  "style": "business" | "minimal" | "vibrant" | "custom",
  "description": "做一个 SaaS 产品展示页",
  "customStyleDescription"?: "紫色为主色调，毛玻璃效果",  // 仅 custom 风格时
  "modelProvider": "deepseek" | "openai" | "anthropic",
}

Response: SSE Stream (见 2.3)
```

### 3.2 对话修改

```typescript
POST /api/page-generator/modify
Content-Type: application/json
Accept: text/event-stream  // SSE

Request Body:
{
  "taskId": "uuid",           // 上次生成的 task 标识
  "currentSchema": PageSchema, // 当前的完整 Schema
  "description": "把三个特性卡片改成四个"
}

Response: SSE Stream
```

### 3.3 确认生成

```typescript
POST /api/page-generator/confirm
Content-Type: application/json

Request Body:
{
  "taskId": "uuid",
  "pageSchema": PageSchema,
  "title": "产品展示页",
  "description"?: "页面描述",
}

Response:
{
  "pageId": 1,
  "slug": "product-showcase-xxxx"
}
```

### 3.4 模型配置

```typescript
POST /api/page-generator/config
Authorization: Bearer <jwt>
Content-Type: application/json

Request Body:
{
  "provider": "deepseek" | "openai" | "anthropic",
  "apiKey": "sk-xxx",
  "model"?: "deepseek-chat" | "gpt-4o" | "claude-sonnet-4-20250514",
  // 可选：自定义 endpoint
  "baseUrl"?: string,
}

GET /api/page-generator/config
Authorization: Bearer <jwt>
Response:
{
  "configured": true,
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  // 不返回 apiKey
}
```

## 4. 数据库模型

### 4.1 AiGenerationTask

```typescript
@Entity('ai_generation_tasks')
class AiGenerationTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  style: string; // 'business' | 'minimal' | 'vibrant' | 'custom'

  @Column({ type: 'text' })
  description: string;  // 用户原始描述

  @Column({ type: 'json', nullable: true })
  schema: PageSchema;   // 最终生成的完整 Schema

  @Column({ type: 'json', nullable: true })
  regions: Array<{ regionId: string; regionType: string; name: string }>;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'generating' | 'completed' | 'failed';

  @Column({ type: 'int', nullable: true })
  pageId: number;       // 确认后关联的 Page ID

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 4.2 PageGeneratorConfig

```typescript
@Entity('page_generator_configs')
class PageGeneratorConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  provider: 'deepseek' | 'openai' | 'anthropic';

  @Column({ type: 'text' })
  apiKey: string; // 建议加密存储

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  baseUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## 5. 前端文件结构

```
apps/editor/src/pages/AiPageGenerator/
├── index.tsx                    # 主页面组件（三步骤向导）
├── StepStyleSelect.tsx          # 步骤1：风格选择
├── StepDescription.tsx          # 步骤2：对话描述
├── StepPreview.tsx              # 步骤3：流式预览 + 对话迭代
├── RegionRenderer.tsx           # 区域渲染器（接收 SSE 逐步渲染）
├── RegionSkeleton.tsx           # 区域骨架屏组件
├── index.less                   # 样式

apps/editor/src/utils/
├── schemaConverter.ts           # 已有：GrapesJS → SchemaNode
├── schemaToHtml.ts              # 新增：SchemaNode → HTML（带 data-schema-type）
└── component-metadata.ts        # 新增：28个组件视觉描述元数据
```

## 6. 后端文件结构

```
apps/server/src/page-generator/
├── page-generator.module.ts     # NestJS 模块（独立注册）
├── page-generator.controller.ts # REST + SSE 控制器
├── page-generator.service.ts    # 核心业务逻辑
├── llm/
│   ├── llm.factory.ts           # LLM 工厂（根据 provider 创建对应客户端）
│   ├── llm.interface.ts         # 统一的 LLM 接口定义
│   ├── providers/
│   │   ├── deepseek.provider.ts # DeepSeek 实现
│   │   ├── openai.provider.ts   # OpenAI 实现
│   │   └── anthropic.provider.ts# Anthropic 实现
├── engine/
│   ├── region-planner.ts        # 区域规划引擎（分析用户描述 → 区域列表）
│   ├── schema-generator.ts      # Schema 生成器（按区域生成 SchemaNode 子树）
│   ├── prompt-builder.ts        # Prompt 构建器（组件元数据 + 区域定义 + 主题）
│   └── schema-modifier.ts       # Schema 修改器（处理迭代修改请求）
├── sse/
│   └── sse-emitter.ts           # SSE 事件推送工具
├── entities/
│   ├── ai-generation-task.entity.ts
│   └── page-generator-config.entity.ts
├── dto/
│   ├── generate.dto.ts
│   ├── modify.dto.ts
│   ├── confirm.dto.ts
│   └── config.dto.ts
└── page-generator.guard.ts      # JWT 认证守卫（复用但不引用 ai 模块的守卫）
```

## 7. LLM Prompt 工程

### 7.1 System Prompt 结构

```
你是一个低代码页面生成助手。根据用户的描述，生成符合以下规范的页面 Schema。

[组件元数据]
列举每个组件的 type、visualDescription、commonProps、styleHints

[预定义区域类型]
列举每个区域的 regionType、描述、推荐组件组合

[主题 Token]
- colorPrimary: #1677ff
- borderRadius: 6px
- fontFamily: Inter, sans-serif
- ...

[页面 Schema 格式]
PageSchema 的完整 TypeScript 类型定义

[输出规范]
- 每个组件必须有 data-schema-type 对应类型
- 文本节点自动提取内容
- ...
```

### 7.2 区域规划 Prompt

```
分析用户的页面需求，选择以下区域类型的组合来构建页面：
[区域列表]

用户需求：{description}
风格：{style}

请返回一个区域列表，按从上到下的顺序排列。
```

### 7.3 区域生成 Prompt

```
页面结构：
[已确定的区域列表]

当前正在生成区域：{regionType} - {regionName}
该区域的推荐组件：{recommendedComponents}

请为该区域生成符合 PageSchema 规范的 SchemaNode 子树。
注意：
1. 文本内容应该体现页面主题，而不是占位符
2. 样式使用主题 Token 或自由生成
3. 组件嵌套不超过 3 层
```

## 8. 关键技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| Schema → 编辑器加载 | HTML 字符串 + data-schema-type | 与现有 schemaConverter 对称，复用 GrapesJS 的 HTML 解析能力 |
| LLM 调用方式 | OpenAI 兼容 SDK + Anthropic SDK | 独立实现，不依赖现有 ai/ 模块 |
| SSE 框架 | NestJS `@Sse()` 原生装饰器 | 无需额外依赖，与 NestJS 深度集成 |
| 配置存储 | 独立实体 `page_generator_configs` | 确保完全解耦，各自管理 API Key |
| API Key 加密 | AES-256-GCM 加密存储 | 敏感信息不可明文存储在数据库 |
| 区域定义 | TypeScript 枚举 + JSON 配置文件 | 编译时检查，运行时注入 prompt |
| 前端渲染 | 原生 React 组件 + SSE EventSource | 无需额外流式框架 |
| 状态管理 | React useState + useRef（无需 Redux） | 作用域仅在 AI 生成页，无需全局状态 |
| 组件元数据 | TypeScript 文件 | 类型安全，与代码同源 |

## 9. Phase 分拆计划

### Phase 1 — 静态骨架生成（MVP）
- 前端：引导页三步向导 + SSE 接收 + 分区域渲染 + 载入编辑器
- 后端：独立模块 + 单模型 LLM（DeepSeek）+ 区域规划 + Schema 生成 + SSE 推送
- 组件元数据：完成全部 28 个组件的 visualDescription
- schemaToHtml：实现 SchemaNode → HTML 的转换（全部 28 种组件）

### Phase 2 — 事件绑定生成
- 扩展 prompt 包含事件引擎（12 种 Action）
- Schema 生成中加入 events 字段
- schemaToHtml 支持 `data-events` 属性的还原

### Phase 3 — 数据源与变量
- 扩展 prompt 包含变量系统和 DataList API 绑定
- Schema 生成中加入 variables 和 dataSource 配置
- 对话迭代体验优化（增量修改，而非全局替换）
