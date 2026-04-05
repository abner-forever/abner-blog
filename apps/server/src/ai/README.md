# AI 模块说明

本目录是后端 AI 能力聚合层，目标是保持接口稳定的前提下，拆分职责、减少重复并便于扩展。

## 目录分层

- `ai.controller.ts`
  - HTTP 入口（普通聊天 + 流式聊天），仅做参数接收与转发。
- `ai.service.ts`
  - 编排层：意图识别、路由分发、会话上下文、流式事件输出、天气聊天输出。
- `ai-command.service.ts`
  - 任务处理层：待办/日程的创建、更新、删除、查询等命令型操作。
- `dto/*`
  - 输入/输出数据结构定义。
- `utils/*`
  - 通用工具与构建器（日期区间、响应构建、文本分块）。
- `langchain/*`
  - LLM 相关能力：
    - `model.ts`：模型调用封装
    - `prompts.ts`：Prompt 常量
    - `intent.ts`：意图识别
    - `extractors/*`：实体提取（todo/event/weather）
    - `parsers.ts`：文本与 JSON 解析、标题清洗
    - `chains.ts`：兼容导出层（过渡）

## 设计约定

- Controller 保持轻量，业务逻辑不下沉到 Controller。
- `AIService` 只做“编排”，命令型业务尽量放在 `AICommandService`。
- 新增 extractor 时，优先放到 `langchain/extractors/`，并保证失败可回退到规则逻辑。
- 优先复用 `utils/response-builders.ts`，避免重复拼装 `clarification_needed`。
- 尽量保持 `./langchain/chains` 导出兼容，迁移期不要随意改上层 import。

## 测试建议

- 至少覆盖以下两组：
  - `src/ai/ai.service.spec.ts`（编排与集成行为）
  - `src/ai/langchain/chains.spec.ts`（意图与提取逻辑）
- 改动抽取逻辑时，优先补“失败回退”与“边界输入”测试用例。

