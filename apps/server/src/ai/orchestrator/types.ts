/**
 * AI 流式事件类型 — SSE 事件协议
 *
 * 共 14 种事件类型，覆盖完整交互状态：
 * - intent: 意图检测完成
 * - thinking_delta: 推理过程实时展示
 * - web_search_status: 联网搜索状态
 * - chat_delta: 流式回复文本（打字机效果）
 * - todo_created/event_created/todo_updated/event_updated/todo_deleted/event_deleted: CRUD 结果
 * - schedule_query: 日程列表+分析
 * - clarification_needed: 信息缺失需要补充
 * - done: 流结束
 * - error: 异常
 */
export interface AIStreamEvent {
  event:
    | 'intent'
    | 'chat'
    | 'clarification_needed'
    | 'todo_created'
    | 'event_created'
    | 'todo_updated'
    | 'event_updated'
    | 'todo_deleted'
    | 'event_deleted'
    | 'schedule_query'
    | 'thinking_delta'
    | 'chat_delta'
    | 'web_search_status'
    | 'done'
    | 'error';
  payload?: Record<string, unknown>;
}
