/**
 * Agent Processor
 *
 * AI Agent 工作流主入口（NestJS Injectable）。
 *
 * 用法（在 AIService 中）：
 *   for await (const event of this.agentProcessor.processMessageStream(
 *     message, userId, llm, currentDate, sessionId, requestConfig
 *   )) { ... }
 */

import { Injectable, Logger } from '@nestjs/common';
import type { ChatImageDto } from '../dto/chat.dto';
import type { ChatRequestDto } from '../dto/chat.dto';
import type { AIStreamEvent } from '../orchestrator/types';
import type { ChatLLM } from '../langchain/model';
import type { ChatResponseDto } from '../dto/extraction-result.dto';
import { mapLlmErrorForUser } from '../utils/llm-user-facing-error';
import { createAgentWorkflow } from './workflow/workflow';
import { AgentEventBus } from './event-bus/agent-event-bus';
import { DEFAULT_MAX_RETRIES, DEFAULT_CONTEXT_WINDOW } from './workflow/state';
import { AICommandService } from '../services/ai-command.service';
import { AIChatSessionService } from '../services/ai-chat-session.service';
import { AIWeatherService } from '../services/ai-weather.service';
import { AIChatResponseService } from '../services/ai-chat-response.service';
import { ChatHistoryService } from '../orchestrator/chat-history.service';
import { ChatStreamService } from '../orchestrator/chat-stream.service';
import { MCPServersService } from '../../mcp/services/mcp-servers.service';
import { WebSearchService } from '../../web-search/web-search.service';
import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';
import { SkillsService } from '../../skills/skills.service';
import { TodosService } from '../../todos/todos.service';

const logger = new Logger('AgentProcessor');

@Injectable()
export class AgentProcessor {
  constructor(
    private readonly chatSessionService: AIChatSessionService,
    private readonly chatHistoryService: ChatHistoryService,
    private readonly chatResponseService: AIChatResponseService,
    private readonly commandService: AICommandService,
    private readonly weatherService: AIWeatherService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly webSearchService: WebSearchService,
    private readonly mcpServersService: MCPServersService,
    private readonly skillsService: SkillsService,
    private readonly todosService: TodosService,
    private readonly chatStreamService: ChatStreamService,
  ) {}

  /**
   * 构建工作流依赖（单例 + 每请求参数）
   */
  private buildWorkflowDeps(llm: ChatLLM, images?: ChatImageDto[]) {
    return {
      chatSessionService: this.chatSessionService,
      chatHistoryService: this.chatHistoryService,
      chatResponseService: this.chatResponseService,
      commandService: this.commandService,
      weatherService: this.weatherService,
      knowledgeBaseService: this.knowledgeBaseService,
      webSearchService: this.webSearchService,
      mcpServersService: this.mcpServersService,
      skillsService: this.skillsService,
      todosService: this.todosService,
      chatStreamService: this.chatStreamService,
      llm,
      images,
    };
  }

  /**
   * 处理消息流式（SSE）
   */
  async *processMessageStream(
    message: string,
    userId: number | undefined,
    llm: ChatLLM,
    currentDate: string = new Date().toISOString(),
    sessionId?: string,
    requestConfig?: ChatRequestDto,
    images?: ChatImageDto[],
  ): AsyncGenerator<AIStreamEvent> {
    const eventBus = new AgentEventBus();
    const hasImages = Boolean(images?.length);
    const contextWindow =
      requestConfig?.contextWindow || DEFAULT_CONTEXT_WINDOW;

    try {
      const workflowDeps = this.buildWorkflowDeps(llm, images);

      const initialState = {
        userInput: message,
        userId: userId ?? (0 as unknown as number),
        sessionId: sessionId || '',
        hasImages,
        currentDate,
        contextWindow,
        systemPrompt: '',
        tools: [],
        toolNames: [] as string[],
        knowledgeContext: null as string | null,
        knowledgeLoaded: false,
        webSearchContext: null as string | null,
        webSearchDone: false,
        messages: [],
        isDone: false,
        retryCount: 0,
        maxRetries: DEFAULT_MAX_RETRIES,
        streamChannel: eventBus,
        errors: [] as string[],
      };

      const workflow = createAgentWorkflow(workflowDeps);

      // EventBus → SSE signal bridge
      let pendingResolver: (() => void) | null = null;
      const eventQueue: AIStreamEvent[] = [];

      const subscription = eventBus.onEvent((agentEvent) => {
        const sse = this.mapAgentEventToSSE(agentEvent);
        if (sse) {
          eventQueue.push(sse);
          if (pendingResolver) {
            pendingResolver();
            pendingResolver = null;
          }
        }
      });

      // Start workflow (background)
      const workflowPromise = workflow.invoke(initialState).catch((err) => {
        logger.error(`Workflow error: ${err}`);
        eventQueue.push({
          event: 'error',
          payload: { error: (err as Error).message },
        });
      });

      try {
        let done = false;
        let yieldedDoneOrError = false;
        while (!done) {
          while (eventQueue.length > 0) {
            const event = eventQueue.shift()!;
            yield event;
            if (event.event === 'done' || event.event === 'error') {
              yieldedDoneOrError = true;
              done = true;
              break;
            }
          }
          if (done) break;

          const raceResult = await Promise.race([
            workflowPromise.then(() => 'done' as const),
            new Promise<'timeout'>((resolve) => {
              pendingResolver = () => resolve('timeout');
            }),
          ]);

          if (raceResult === 'done') {
            done = true;
            while (eventQueue.length > 0) {
              const event = eventQueue.shift()!;
              yield event;
              if (event.event === 'done' || event.event === 'error') {
                yieldedDoneOrError = true;
                break;
              }
            }
          }
        }

        // Ensure at least one done event (fallback for edge cases)
        if (!yieldedDoneOrError) {
          yield { event: 'done', payload: { type: 'chat' } };
        }
      } finally {
        subscription.unsubscribe();
      }
    } catch (error) {
      yield {
        event: 'error',
        payload: {
          error: mapLlmErrorForUser(
            error instanceof Error ? error.message : '处理消息时发生错误',
          ),
        },
      };
    } finally {
      eventBus.dispose();
    }
  }

  /**
   * 非流式处理
   */
  async processMessage(
    message: string,
    userId: number | undefined,
    llm: ChatLLM,
    currentDate?: string,
    sessionId?: string,
    requestConfig?: ChatRequestDto,
    images?: ChatImageDto[],
  ): Promise<ChatResponseDto> {
    const events: AIStreamEvent[] = [];
    try {
      for await (const event of this.processMessageStream(
        message,
        userId,
        llm,
        currentDate,
        sessionId,
        requestConfig,
        images,
      )) {
        events.push(event);
        if (event.event === 'done' || event.event === 'error') break;
      }
      return this.eventsToResponse(events);
    } catch (error) {
      return {
        type: 'error',
        error: error instanceof Error ? error.message : '处理消息时发生错误',
      };
    }
  }

  private mapAgentEventToSSE(
    agentEvent: import('./event-bus/agent-event-bus').AgentEvent,
  ): AIStreamEvent | null {
    const { event, payload } = agentEvent;
    switch (event) {
      case 'thinking_delta':
      case 'chat_delta':
      case 'web_search_status':
      case 'done':
      case 'error':
        return { event, payload };
      case 'tool_call_start':
        return null;
      case 'tool_call_error':
        // 工具执行失败但 workflow 会继续（LLM 从预处理的上下文回答）
        // 不注入可见 chat 文本，避免错误信息与正常回复拼接
        return null;
      case 'tool_call_result':
      case 'preprocess_done':
      case 'agent_thinking':
        return null;
      case 'intent':
      case 'todo_created':
      case 'todo_updated':
      case 'todo_deleted':
      case 'event_created':
      case 'event_updated':
      case 'event_deleted':
      case 'schedule_query':
        return { event, payload };
      default:
        return null;
    }
  }

  private eventsToResponse(events: AIStreamEvent[]): ChatResponseDto {
    const chatContent = events
      .filter((e) => e.event === 'chat_delta')
      .map((e) => (e.payload?.delta as string) || '')
      .join('');

    if (chatContent) return { type: 'chat', content: chatContent };

    const errorEvent = events.find((e) => e.event === 'error');
    if (errorEvent) {
      return {
        type: 'error',
        error:
          typeof errorEvent.payload?.error === 'string'
            ? errorEvent.payload.error
            : '处理消息时发生错误',
      };
    }

    return { type: 'chat', content: undefined };
  }
}
