/**
 * Agent EventBus — LangGraph 工作流内实时推送 SSE 事件的 EventEmitter
 *
 * 设计：
 * - 每个 Agent 会话创建一个独立的 EventBus 实例
 * - Workflow Nodes 通过 state.streamChannel 引用它，实时 emit 事件
 * - AgentProcessor 订阅 EventBus，将事件实时 yield 给 SSE Response
 *
 * SSE 协议扩展（在 AIStreamEvent 基础上新增）：
 * - preprocess_done: 预处理完成
 * - agent_thinking: LLM 推理过程中的思考
 * - tool_call_start: 开始执行工具
 * - tool_call_result: 工具执行完成
 * - tool_call_error: 工具执行失败/降级
 */

import { EventEmitter } from 'events';

/** Agent 工作流 SSE 事件类型 */
export type AgentEventType =
  | 'preprocess_done'
  | 'agent_thinking'
  | 'tool_call_start'
  | 'tool_call_result'
  | 'tool_call_error'
  | 'thinking_delta'
  | 'chat_delta'
  | 'web_search_status'
  | 'done'
  | 'error'
  // 结构化工具结果事件（前端富卡片展示）
  | 'intent'
  | 'todo_created'
  | 'todo_updated'
  | 'todo_deleted'
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'schedule_query';

/** Agent 事件载荷 */
export interface AgentEvent {
  event: AgentEventType;
  payload?: Record<string, unknown>;
}

/**
 * 事件总线 — 每个 Agent 会话一个实例
 * Node 内通过 `state.streamChannel.emit()` 实时推送事件
 * AgentProcessor 通过 `eventBus.onEvent()` 订阅并 yield 给 SSE
 */
export class AgentEventBus {
  private emitter = new EventEmitter();
  private _emittedCount = 0;

  /** 获取已发射事件总数 */
  get emittedCount(): number {
    return this._emittedCount;
  }

  /**
   * 发射一个 SSE 事件
   * 可在任意 Node 中调用，线程安全
   */
  emit(event: AgentEvent): void {
    this._emittedCount++;
    this.emitter.emit('agent_event', event);
  }

  /**
   * 便捷方法：发射 tool_call_start
   */
  emitToolCallStart(toolName: string, args: unknown): void {
    this.emit({
      event: 'tool_call_start',
      payload: { toolName, args },
    });
  }

  /**
   * 便捷方法：发射 tool_call_result
   */
  emitToolCallResult(
    toolName: string,
    duration: number,
    status: 'success' | 'fallback' | 'error',
  ): void {
    this.emit({
      event: 'tool_call_result',
      payload: { toolName, duration, status },
    });
  }

  /**
   * 便捷方法：发射工具错误
   */
  emitToolCallError(
    toolName: string,
    error: string,
    fallbackUsed: boolean,
  ): void {
    this.emit({
      event: 'tool_call_error',
      payload: { toolName, error, fallbackUsed },
    });
  }

  /**
   * 便捷方法：发射 intent 事件（通知前端当前意图）
   */
  emitIntent(intent: string): void {
    this.emit({ event: 'intent', payload: { intent } });
  }

  /**
   * 便捷方法：发射 todo_created 事件
   */
  emitTodoCreated(data: Record<string, unknown>): void {
    this.emit({ event: 'todo_created', payload: { data } });
  }

  /**
   * 便捷方法：发射 todo_updated 事件
   */
  emitTodoUpdated(data: Record<string, unknown>): void {
    this.emit({ event: 'todo_updated', payload: { data } });
  }

  /**
   * 便捷方法：发射 todo_deleted 事件
   */
  emitTodoDeleted(data: Record<string, unknown>): void {
    this.emit({ event: 'todo_deleted', payload: { data } });
  }

  /**
   * 便捷方法：发射 event_created 事件
   */
  emitEventCreated(data: Record<string, unknown>): void {
    this.emit({ event: 'event_created', payload: { data } });
  }

  /**
   * 便捷方法：发射 event_updated 事件
   */
  emitEventUpdated(data: Record<string, unknown>): void {
    this.emit({ event: 'event_updated', payload: { data } });
  }

  /**
   * 便捷方法：发射 event_deleted 事件
   */
  emitEventDeleted(data: Record<string, unknown>): void {
    this.emit({ event: 'event_deleted', payload: { data } });
  }

  /**
   * 便捷方法：发射 schedule_query 事件
   */
  emitScheduleQuery(
    scheduleData: unknown[],
    analysis?: Record<string, unknown>,
  ): void {
    this.emit({
      event: 'schedule_query',
      payload: { scheduleData, analysis },
    });
  }

  /**
   * 订阅所有 Agent 事件
   * 返回 unsubscribe 函数
   */
  onEvent(handler: (event: AgentEvent) => void): { unsubscribe: () => void } {
    this.emitter.on('agent_event', handler);
    return {
      unsubscribe: () => {
        this.emitter.off('agent_event', handler);
      },
    };
  }

  /**
   * 清理所有监听器
   */
  dispose(): void {
    this.emitter.removeAllListeners();
  }
}
