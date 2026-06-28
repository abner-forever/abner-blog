# Page Generator AI

> AI 驱动的低代码页面自动生成能力，通过自然语言描述页面效果，由 AI 自动生成 PageSchema 并载入 GrapesJS 编辑器。

## Purpose

当前低代码平台支持手动拖拽生成页面，但缺少 AI 辅助生成能力。本规范定义了一个独立的 AI 页面生成系统，用户通过自然语言描述页面效果，系统自动生成符合 `@abner-blog/page-schema` 规范的 PageSchema，并通过 SSE 流式分区域渲染，最终载入 GrapesJS 编辑器供用户微调。该系统与现有 `ai/` 模块完全解耦，拥有独立的 LLM 接入、配置管理和业务逻辑。

## Requirements

### Requirement: AI 生成向导入口

The system SHALL provide a dedicated AI page generation wizard page at `/editor/ai-create` within the editor app.

#### Scenario: 用户进入 AI 生成页面
- GIVEN 用户在编辑器首页
- WHEN 用户点击"AI 生成"入口
- THEN 系统导航到 `/editor/ai-create` 向导页面
- AND 向导页面显示三步骤流程：选择风格 → 描述需求 → 生成预览

#### Scenario: 用户直接访问 AI 生成页
- GIVEN 用户未登录
- WHEN 用户访问 `/editor/ai-create`
- THEN 系统重定向到登录页面
- AND 登录完成后返回该页面

#### Scenario: 用户已完成页面生成
- GIVEN 用户已完成 AI 页面生成
- WHEN 用户点击"载入编辑器"
- THEN 系统创建 Page 记录并跳转到 GrapesJS 编辑器页面
- AND 编辑器载入 AI 生成的页面内容并进入可编辑状态

### Requirement: 后端独立模块

The system SHALL implement a new independent backend module at `apps/server/src/page-generator/` with zero coupling to the existing `apps/server/src/ai/` module.

#### Scenario: 模块初始化
- GIVEN 服务启动
- WHEN NestJS 扫描模块
- THEN `PageGeneratorModule` 注册到根模块
- AND 不引用 `AIModule` 中的任何 provider、service 或 controller

#### Scenario: 模块包含完整 CRUD
- GIVEN PageGeneratorModule 已注册
- WHEN 查看模块结构
- THEN 模块包含 controller、service、dto、entities 子目录
- AND 独立管理自己的数据库实体（如 `AiGenerationTask`）

### Requirement: 多模型 LLM 接入

The system SHALL support three LLM providers: DeepSeek, OpenAI (兼容格式), and Anthropic Claude, with independent API key configuration.

#### Scenario: 用户配置模型参数
- GIVEN 用户首次使用 AI 生成
- WHEN 进入向导页面
- THEN 系统提示用户选择 LLM 提供商并填入 API Key
- AND 配置保存到 `PageGeneratorConfig` 实体，不与现有 `AIConfig` 共享

#### Scenario: 使用 DeepSeek 生成
- GIVEN 用户已配置 DeepSeek API Key
- WHEN 用户提交页面描述
- THEN 系统使用 DeepSeek Chat API 调用大模型
- AND 请求格式兼容 OpenAI SDK

#### Scenario: 使用 Anthropic Claude 生成
- GIVEN 用户已配置 Anthropic API Key
- WHEN 用户提交页面描述
- THEN 系统使用 Anthropic SDK 调用 Claude 模型
- AND 使用 Tool Use / Structured Output 约束生成格式

#### Scenario: 使用 OpenAI 生成
- GIVEN 用户已配置 OpenAI API Key
- WHEN 用户提交页面描述
- THEN 系统使用 OpenAI SDK 调用 GPT 模型
- AND 使用 JSON Mode 约束输出格式

### Requirement: 分区域页面生成 + SSE 流式推送

The system SHALL generate pages by pre-defined regions and push results to the frontend via SSE (Server-Sent Events) at component-level granularity.

#### Scenario: 用户提交生成请求
- GIVEN 用户已完成模板选择和需求描述
- WHEN 用户点击"生成页面"
- THEN 前端发起 POST 请求到 `/api/page-generator/generate` 并建立 SSE 连接
- AND 后端返回 `content-type: text/event-stream` 响应

#### Scenario: 区域级流式推送
- GIVEN 后端正在生成页面
- WHEN 一个区域的组件开始生成
- THEN 后端推送 `event: region_start` 事件，包含 `regionId`、`regionType`、`name`
- AND 该区域内的每个组件生成完毕后推送 `event: region_component` 事件
- AND 该区域所有组件生成完毕后推送 `event: region_end` 事件，包含完整 `schema` 对象
- AND SSE 事件格式如下：
  ```
  event: region_start
  data: {"regionId":"hero","regionType":"hero","name":"主视觉区域"}
  
  event: region_component
  data: {"regionId":"hero","componentType":"text","props":{"as":"h1","content":"欢迎来到我们的产品"}}
  
  event: region_component
  data: {"regionId":"hero","componentType":"button","props":{"text":"了解更多","variant":"primary"}}
  
  event: region_end
  data: {"regionId":"hero","schema":{"id":"...","type":"section","props":{...,"children":[...]}}}
  ```

#### Scenario: 生成完成与错误
- GIVEN 所有区域生成完毕
- WHEN 最后一个 `region_end` 发送完成
- THEN 推送 `event: complete` 事件，包含完整 `pageSchema` 对象和 `regions` 列表
- AND 如某区域生成失败，推送 `event: error` 事件，包含 `regionId` 和 `retryable` 状态
- AND 前端显示错误区域并允许用户选择重试或跳过

### Requirement: 预定义页面区域

The system SHALL pre-define a fixed set of page regions that the AI can choose from when constructing a page structure.

#### Scenario: 区域类型可枚举
- GIVEN 系统定义了页面区域
- WHEN 查看区域列表
- THEN 包含以下预定义区域类型，每种区域有名称、描述、推荐组件和布局约束：

| regionType | name | 描述 | 推荐组件 |
|------------|------|------|----------|
| `header` | 顶部导航 | 页面顶部导航栏 | nav-menu, nav-link, container, image(Logo) |
| `hero` | 主视觉 | 页面首屏大图/Banner 区域 | container, text(h1), text(p), button, image |
| `features` | 特性展示 | 产品/服务特性列表 | row, column, card, text, image |
| `carousel` | 轮播展示 | 图片/内容轮播区域 | carousel, container |
| `content` | 内容区 | 通用内容展示区域 | container, text, image, divider, spacer |
| `cta` | 行动号召 | 引导用户操作的区域 | container, text, button |
| `testimonials` | 客户评价 | 客户评价/案例展示 | card, row, column, carousel |
| `pricing` | 价格表 | 产品定价方案 | card, row, column, button, text |
| `gallery` | 图库展示 | 图片/作品展示 | image, row, column, container |
| `form` | 表单 | 联系/注册表单 | form, form-input, form-textarea, form-select, form-checkbox, form-submit |
| `footer` | 底部 | 页面底部信息 | container, text, nav-link, divider |

#### Scenario: AI 按区域规划页面
- GIVEN 用户描述页面需求
- WHEN AI 分析用户需求
- THEN AI 从预定义区域类型中选择合适的区域组合
- AND 每个区域生成独立的 SchemaNode 子树
- AND 不生成预定义区域之外的区域结构

### Requirement: 组件元数据定义

The system SHALL maintain a TypeScript metadata file defining all 28 components with visual descriptions for LLM context injection.

#### Scenario: 组件元数据格式
- GIVEN 系统定义了组件元数据
- WHEN 查看 `apps/editor/src/utils/component-metadata.ts`
- THEN 每个组件定义包含：`type`、`displayName`、`visualDescription`、`commonProps`、`styleHints`、`typicalChildren`
- AND 文件导出 `COMPONENT_METADATA: Record<string, ComponentMeta>` 对象

#### Scenario: 元数据用于 AI Prompt
- GIVEN 用户提交生成请求
- WHEN 后端构造 system prompt
- THEN `COMPONENT_METADATA` 的内容作为系统上下文注入到 LLM
- AND LLM 理解每个组件的用途、外观、可用属性和典型子组件

### Requirement: 混合样式策略

The system SHALL use a hybrid style strategy: base styles from theme tokens and custom styles from AI free generation.

#### Scenario: AI 使用主题 Token
- GIVEN AI 正在生成组件样式
- WHEN AI 决定使用"主色"或"品牌色"
- THEN AI 映射到 `colorPrimary: '#1677ff'` 主题 Token
- AND 通用样式参数从预定义 Token 系统读取

#### Scenario: AI 自由生成样式
- GIVEN AI 正在生成组件样式
- WHEN 用户描述特殊样式需求（如"毛玻璃效果""渐变色背景"）
- THEN AI 自行生成对应的 CSS 属性值
- AND 生成的样式以 inline style 形式写入组件 props.style

### Requirement: Schema → GrapesJS 反向转换

The system SHALL implement a reverse converter that transforms SchemaNode trees into HTML strings compatible with GrapesJS editor initialization.

#### Scenario: AI 生成页载入编辑器
- GIVEN 用户已完成 AI 页面生成
- WHEN 用户点击"载入编辑器"
- THEN 前端调用 `schemaToHtml(schema)` 将 PageSchema 转换为带 `data-schema-type` 属性的 HTML 字符串
- AND 包装为 GrapesJS `onLoad` 可接受的 `{ project: { pages: [{ component: htmlString }] } }` 格式
- AND 编辑器载入后，用户可正常拖拽微调页面

#### Scenario: schemaToHtml 函数位置
- GIVEN 需要加载 Schema 到编辑器
- WHEN 查看代码结构
- THEN `schemaToHtml()` 位于 `apps/editor/src/utils/schemaToHtml.ts`
- AND 与 `schemaConverter.ts`（SchemaNode → HTML）同目录，形成双向转换对

### Requirement: 分阶段动态行为支持

The system SHALL implement dynamic behavior (event bindings, data sources, variables) in three progressive phases.

#### Scenario: Phase 1 - 静态骨架生成
- GIVEN AI 生成页面
- WHEN Phase 1 阶段
- THEN AI 只生成组件布局、样式和静态文本内容
- AND 所有事件绑定、变量、数据源默认为空
- AND 用户生成完成后需在编辑器中手动配置动态行为

#### Scenario: Phase 2 - 事件绑定生成
- GIVEN AI 生成页面且 Phase 1 已完成
- WHEN Phase 2 阶段
- THEN AI 理解并生成事件绑定（click → open-modal、navigate、toast 等）
- AND 支持的事件类型包括：`open-modal`、`close-modal`、`navigate`、`toast`、`confirm`、`reload`、`back`、`scroll-to`

#### Scenario: Phase 3 - 数据源与变量
- GIVEN AI 生成页面且 Phase 2 已完成
- WHEN Phase 3 阶段
- THEN AI 理解并生成数据源绑定和变量引用
- AND 支持 `{{query.xxx}}` URL 参数变量、`{{variable.xxx}}` 自定义变量
- AND DataList 组件可关联 API 数据源

### Requirement: 对话式迭代修改

The system SHALL support conversational iterative refinement after initial page generation.

#### Scenario: 用户提出修改
- GIVEN 页面已生成并处于预览状态
- WHEN 用户输入"把三个特性卡片改成四个"
- THEN 系统将修改请求与当前 PageSchema 一起发送给 LLM
- AND LLM 返回增量的 SchemaNode 变更
- AND 前端对应区域或组件更新渲染

#### Scenario: 用户修改失败回退
- GIVEN 页面已生成并处于预览状态
- WHEN 用户的修改请求无法被 LLM 理解或执行
- THEN 系统返回错误信息
- AND 保持当前页面状态不变
- AND 提示用户重新描述

### Requirement: 前端流式渲染

The frontend SHALL render AI-generated components incrementally via SSE events without requiring full page re-render.

#### Scenario: 分区域渲染
- GIVEN 前端已连接 SSE
- WHEN 收到 `region_start` 事件
- THEN 前端创建一个空的区域容器并显示"正在生成..."占位
- WHEN 收到 `region_component` 事件
- THEN 前端将组件追加到当前区域容器中
- WHEN 收到 `region_end` 事件
- THEN 前端用完整 region schema 替换增量构建的组件

#### Scenario: 加载与错误状态
- GIVEN 页面正在生成
- WHEN 某个区域尚未生成完成
- THEN 该区域显示 Skeleton 加载骨架屏
- WHEN 收到 `error` 事件
- THEN 对应区域显示错误状态和重试按钮
- AND 不阻塞其他区域的正常渲染
