import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { UniversalChatLLM } from './langchain/model';
import type { ChatLLM } from './langchain/model';
import { detectIntent } from './langchain/chains';
import {
  IntentType,
  ChatResponseDto,
  ScheduleAnalysisDto,
  ClarificationNeededDto,
} from './dto/extraction-result.dto';
import { CHAT_STREAM_CHUNK_SIZE } from './constants';
import { splitTextToChunks } from './utils/text';
import { AICommandService } from './services/ai-command.service';
import { AIConfigService } from './services/ai-config.service';
import type { ChatImageDto } from './dto/chat.dto';
import { ChatRequestDto, SaveAIConfigDto } from './dto/chat.dto';
import { buildChatHumanMessage } from './utils/build-chat-human-message';
import { AIChatSessionService } from './services/ai-chat-session.service';
import { AIWeatherService } from './services/ai-weather.service';
import { AIChatResponseService } from './services/ai-chat-response.service';
import { WebSearchService } from '../web-search/web-search.service';
import { shouldOfferWebSearchMcp } from './utils/web-search-mcp-trigger';
import { mapLlmErrorForUser } from './utils/llm-user-facing-error';
import {
  splitCompleteReplyThink,
  splitThinkTaggedDelta,
} from './utils/think-tag-split';
import {
  buildChatHistoryUserLine,
  toHistoryUserText,
  validateChatImages,
} from './utils/chat-images';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { MCPServersService } from '../mcp';
import { SkillsService } from '../skills/skills.service';
import { ChatHistoryService } from './orchestrator/chat-history.service';
import { ChatMcpRouterService } from './orchestrator/chat-mcp-router.service';
import { ChatStreamService } from './orchestrator/chat-stream.service';
import type { AIStreamEvent } from './orchestrator/types';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly maxHistoryMessages = 10;

  constructor(
    private readonly aiCommandService: AICommandService,
    private readonly aiConfigService: AIConfigService,
    private readonly chatSessionService: AIChatSessionService,
    private readonly weatherService: AIWeatherService,
    private readonly chatResponseService: AIChatResponseService,
    private readonly webSearchCore: WebSearchService,
    private readonly mcpServersService: MCPServersService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly skillsService: SkillsService,
    private readonly chatHistoryService: ChatHistoryService,
    private readonly chatMcpRouterService: ChatMcpRouterService,
    private readonly chatStreamService: ChatStreamService,
  ) {
    // 兼容旧部署：允许通过用户配置或请求内 apiKey 注入。
  }

  /**
   * 搜索用户知识库并构建上下文字符串
   */
  private async buildKnowledgeBaseContext(
    message: string,
    userId: number | undefined,
  ): Promise<string> {
    if (!userId) return '';
    try {
      const results = await this.knowledgeBaseService.search(
        { query: message, topK: 3 },
        userId,
      );
      if (results.length === 0) {
        this.logger.log(
          `[KB RAG] userId=${userId} prompt_context=empty (search returned 0 rows)`,
        );
        return '';
      }
      const contextParts = results.map(
        (r, i) => `[知识库${i + 1}] ${r.content}`,
      );
      const block = `以下是知识库中相关信息，请结合回答：\n${contextParts.join('\n')}`;
      this.logger.log(
        `[KB RAG] userId=${userId} prompt_context=hits=${results.length} contextChars=${block.length} topScore=${results[0]?.score ?? 'n/a'}`,
      );
      return block;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `[KB RAG] userId=${userId} search_threw → empty_context msg=${msg}`,
      );
      return '';
    }
  }

  private async buildSkillSystemMessage(
    userId: number | undefined,
    requestConfig: ChatRequestDto | undefined,
    userMessage: string,
  ): Promise<SystemMessage | null> {
    if (!userId) return null;
    const text = await this.skillsService.buildSystemPromptForChat(
      userId,
      requestConfig?.skillId,
      userMessage,
    );
    return text ? new SystemMessage(text) : null;
  }

  /**
   * 处理用户消息（非流式）
   *
   * 复用 processMessageStream 的流式逻辑，收集所有事件后合并为 ChatResponseDto。
   * 消除非流式/流式两条路径的重复意图检测和路由逻辑。
   */
  async processMessage(
    message: string,
    userId: number | undefined,
    currentDate: string = new Date().toISOString(),
    sessionId?: string,
    requestConfig?: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const events: AIStreamEvent[] = [];
    try {
      for await (const event of this.processMessageStream(
        message,
        userId,
        currentDate,
        sessionId,
        requestConfig,
      )) {
        events.push(event);
        if (event.event === 'done' || event.event === 'error') break;
      }
      return this.eventsToResponse(events);
    } catch (error) {
      // processMessageStream 的 try/catch 已捕获大部分错误，
      // 这里仅兜底处理 Generator 层面的异常（极少发生）
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw error;
      return {
        type: 'error',
        error: mapLlmErrorForUser(
          error instanceof Error ? error.message : '处理消息时发生错误',
        ),
      };
    }
  }

  /**
   * 将流式事件序列合并为非流式 ChatResponseDto
   */
  private eventsToResponse(events: AIStreamEvent[]): ChatResponseDto {
    // 找最后一个非 transient 事件（排除 intent/thinking/chat_delta/web_search/done）
    const lastResultEvent = [...events]
      .reverse()
      .find(
        (e) =>
          e.event !== 'intent' &&
          e.event !== 'thinking_delta' &&
          e.event !== 'web_search_status' &&
          e.event !== 'chat_delta' &&
          e.event !== 'done',
      );

    if (!lastResultEvent) {
      // 只有 done + chat_delta 时，拼接 chat delta
      const chatContent = events
        .filter((e) => e.event === 'chat_delta')
        .map((e) => (e.payload?.delta as string) || '')
        .join('');
      return chatContent
        ? { type: 'chat', content: chatContent }
        : { type: 'chat', content: undefined };
    }

    const { event, payload } = lastResultEvent;

    if (event === 'error') {
      return {
        type: 'error',
        error:
          typeof payload?.error === 'string'
            ? payload.error
            : '处理消息时发生错误',
      };
    }

    if (
      event === 'todo_created' ||
      event === 'event_created' ||
      event === 'todo_updated' ||
      event === 'event_updated' ||
      event === 'todo_deleted' ||
      event === 'event_deleted'
    ) {
      return {
        type: event,
        data: payload?.data as Record<string, unknown> | undefined,
      };
    }

    if (event === 'schedule_query') {
      return {
        type: 'schedule_query',
        scheduleData: payload?.scheduleData as
          | Record<string, unknown>[]
          | undefined,
        scheduleAnalysis: payload?.analysis as ScheduleAnalysisDto | undefined,
      };
    }

    if (event === 'clarification_needed') {
      return {
        type: 'clarification_needed',
        clarification: payload?.clarification as
          | ClarificationNeededDto
          | undefined,
      };
    }

    if (event === 'chat') {
      return {
        type: 'chat',
        content:
          typeof payload?.content === 'string' ? payload.content : undefined,
      };
    }

    const chatContent = events
      .filter((e) => e.event === 'chat_delta')
      .map((e) => (typeof e.payload?.delta === 'string' ? e.payload.delta : ''))
      .join('');
    return chatContent
      ? { type: 'chat', content: chatContent }
      : { type: 'chat', content: undefined };
  }

  /**
   * 处理用户消息（流式）
   */
  async *processMessageStream(
    message: string,
    userId: number | undefined,
    currentDate: string = new Date().toISOString(),
    sessionId?: string,
    requestConfig?: ChatRequestDto,
  ): AsyncGenerator<AIStreamEvent> {
    process.stderr.write(`[AI Stream] Received message: ${message}\n`);
    try {
      validateChatImages(requestConfig?.images);
      const { llm, thinkingEnabled, useMcpTools } = await this.buildLLM(
        userId,
        requestConfig,
      );
      const contextWindow =
        requestConfig?.contextWindow ?? this.maxHistoryMessages;
      const streamStart = Date.now();
      const hasImages = Boolean(requestConfig?.images?.length);
      const intent = await detectIntent(llm, message, {
        userId,
        hasImages,
        currentDate,
        shouldUseFastPath: (msg) =>
          this.chatResponseService.shouldUseFastPath(msg),
      });
      process.stderr.write(
        `[AI Stream] Intent resolved: ${intent}, cost=${Date.now() - streamStart}ms\n`,
      );
      yield { event: 'intent', payload: { intent } };

      if (intent === IntentType.CHAT) {
        yield* this.streamChatOrSearchIntent(
          llm,
          message,
          userId,
          sessionId,
          useMcpTools,
          requestConfig,
          contextWindow,
          thinkingEnabled,
        );
        yield { event: 'done', payload: { type: 'chat' } };
        return;
      }

      const result = await this.processByIntent(
        llm,
        intent,
        message,
        userId,
        currentDate,
        sessionId,
        contextWindow,
        requestConfig?.images,
        useMcpTools,
        requestConfig,
      );
      this.chatHistoryService.appendIntentResultToHistoryIfNeeded(
        intent,
        toHistoryUserText(message, requestConfig?.images),
        userId,
        sessionId,
        result,
      );
      yield {
        event: result.type as AIStreamEvent['event'],
        payload: {
          content: result.content,
          data: result.data,
          clarification: result.clarification,
          scheduleData: result.scheduleData,
          analysis: (result as { scheduleAnalysis?: unknown }).scheduleAnalysis,
          error: result.error,
        },
      };

      yield { event: 'done', payload: { type: result.type } };
    } catch (error) {
      yield {
        event: 'error',
        payload: {
          error: mapLlmErrorForUser(
            error instanceof Error ? error.message : '处理消息时发生错误',
          ),
        },
      };
    }
  }

  private async *streamChatOrSearchIntent(
    llm: ChatLLM,
    message: string,
    userId: number | undefined,
    sessionId: string | undefined,
    useMcpTools: boolean,
    requestConfig: ChatRequestDto | undefined,
    contextWindow: number,
    thinkingEnabled: boolean,
  ): AsyncGenerator<AIStreamEvent> {
    if (useMcpTools) {
      const userInfoResult =
        await this.chatMcpRouterService.tryHandleUserInfoViaMcp(
          message,
          userId,
          sessionId,
        );
      if (userInfoResult) {
        yield* this.chatStreamService.emitChatDeltaChunks(
          userInfoResult.content,
        );
        return;
      }

      const githubResult =
        await this.chatMcpRouterService.tryHandleGithubChatViaMcp(
          message,
          userId,
          sessionId,
        );
      if (githubResult) {
        yield* this.chatStreamService.emitChatDeltaChunks(githubResult.content);
        return;
      }
    }

    const showWebSearchUi = shouldOfferWebSearchMcp(message);
    if (showWebSearchUi) {
      yield { event: 'web_search_status', payload: { status: 'searching' } };
    }

    let webSearchResolved:
      | { kind: 'digest'; text: string }
      | { kind: 'blocked'; text: string }
      | null;
    try {
      webSearchResolved = await this.resolveWebSearchDigestForUser(
        message,
        userId,
        useMcpTools,
      );
    } catch (err) {
      if (showWebSearchUi) {
        yield { event: 'web_search_status', payload: { status: 'done' } };
      }
      throw err;
    }

    if (showWebSearchUi) {
      yield { event: 'web_search_status', payload: { status: 'done' } };
    }

    if (webSearchResolved?.kind === 'blocked') {
      yield* this.chatStreamService.emitChatDeltaChunks(webSearchResolved.text);
      return;
    }
    if (webSearchResolved?.kind === 'digest') {
      yield* this.streamGeneralChatIntent(
        llm,
        message,
        userId,
        sessionId,
        requestConfig,
        contextWindow,
        thinkingEnabled,
        { searchDigestFromMcp: webSearchResolved.text },
      );
      return;
    }

    yield* this.streamGeneralChatIntent(
      llm,
      message,
      userId,
      sessionId,
      requestConfig,
      contextWindow,
      thinkingEnabled,
    );
  }

  private async *streamGeneralChatIntent(
    llm: ChatLLM,
    message: string,
    userId: number | undefined,
    sessionId: string | undefined,
    requestConfig: ChatRequestDto | undefined,
    contextWindow: number,
    thinkingEnabled: boolean,
    options?: { searchDigestFromMcp?: string },
  ): AsyncGenerator<AIStreamEvent> {
    let promptForLlm: string;
    if (options?.searchDigestFromMcp) {
      promptForLlm = this.chatResponseService.buildWebSearchChatPrompt(
        message,
        options.searchDigestFromMcp,
      );
    } else {
      const kbContext = await this.buildKnowledgeBaseContext(message, userId);
      const basePrompt = this.chatResponseService.buildPrompt(message);
      promptForLlm = kbContext ? `${kbContext}\n\n${basePrompt}` : basePrompt;
    }

    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    const history = this.chatSessionService.getHistoryMessages(sessionKey);
    const scopedHistory = this.chatHistoryService.sliceHistoryForContext(
      history,
      contextWindow,
    );
    let hasDelta = false;
    let fullReply = '';
    const generationStart = Date.now();
    let firstDeltaLogged = false;
    const thinkTagState = {
      inThink: false,
      pending: '',
    };
    const userImages = options?.searchDigestFromMcp
      ? undefined
      : requestConfig?.images;
    const userHuman = buildChatHumanMessage(promptForLlm, userImages);
    const imageCount = userImages?.length ?? 0;
    const skillSystem = await this.buildSkillSystemMessage(
      userId,
      requestConfig,
      message,
    );
    const skillPrefix: BaseMessage[] = skillSystem ? [skillSystem] : [];
    this.logger.log(
      `[AI Chat] stream_start userId=${userId} provider=${requestConfig?.provider ?? '?'} model=${requestConfig?.model ?? '?'} images=${imageCount} messageLen=${message.length}`,
    );
    for await (const streamChunk of llm.invokeStream([
      ...skillPrefix,
      ...scopedHistory,
      userHuman,
    ])) {
      const tagged = splitThinkTaggedDelta(
        streamChunk.answerDelta,
        thinkTagState,
      );
      const answerDeltaFromContent = tagged.answerDelta;
      const thinkingDeltaFromContent = tagged.reasoningDelta;
      const thinkingDeltaRaw = streamChunk.reasoningDelta;
      const thinkingDelta = thinkingDeltaFromContent + thinkingDeltaRaw;
      if (thinkingEnabled && thinkingDelta) {
        yield { event: 'thinking_delta', payload: { delta: thinkingDelta } };
      }
      const delta = answerDeltaFromContent;
      if (!delta) continue;
      const appendDelta = this.chatResponseService.extractIncrementalDelta(
        fullReply,
        delta,
      );
      if (!appendDelta) continue;
      if (!firstDeltaLogged) {
        firstDeltaLogged = true;
        process.stderr.write(
          `[AI Stream] First chat delta in ${Date.now() - generationStart}ms\n`,
        );
      }
      hasDelta = true;
      fullReply += appendDelta;
      yield { event: 'chat_delta', payload: { delta: appendDelta } };
    }

    if (!hasDelta) {
      this.logger.warn(
        `[AI Chat] stream_no_delta → 将走 invoke 回退（MiniMax M2 请确认流式 delta 是否在 reasoning_content） fullReplyLen=${fullReply.length}`,
      );
      const fallback = await this.handleChat(
        llm,
        message,
        userId,
        sessionId,
        contextWindow,
        userImages,
        options?.searchDigestFromMcp ? promptForLlm : undefined,
        options?.searchDigestFromMcp,
        requestConfig,
      );
      const content = this.chatResponseService.normalizeAssistantReply(
        (fallback.content || '').trim(),
      );
      const fallbackSplit = splitThinkTaggedDelta(content, {
        inThink: false,
        pending: '',
      });
      if (thinkingEnabled && fallbackSplit.reasoningDelta) {
        const thinkingChunks = splitTextToChunks(
          fallbackSplit.reasoningDelta,
          CHAT_STREAM_CHUNK_SIZE,
        );
        for (const chunk of thinkingChunks) {
          yield { event: 'thinking_delta', payload: { delta: chunk } };
        }
      }
      const answerContent = fallbackSplit.answerDelta || content;
      yield* this.chatStreamService.emitChatDeltaChunks(answerContent);
      this.logger.log(
        `[AI Chat] stream_end hasDelta=${hasDelta} replyLen=${hasDelta ? fullReply.trim().length : 'n/a'}`,
      );
      return;
    }

    this.chatSessionService.appendHistory(
      sessionKey,
      buildChatHistoryUserLine(
        message,
        userImages,
        options?.searchDigestFromMcp,
      ),
      this.chatResponseService.normalizeAssistantReply(fullReply.trim()),
      this.maxHistoryMessages,
    );
    this.logger.log(
      `[AI Chat] stream_end hasDelta=${hasDelta} replyLen=${hasDelta ? fullReply.trim().length : 'n/a'}`,
    );
  }

  private async handleDeleteTodo(
    message: string,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleDeleteTodo(message, userId, useMcpTools);
  }

  private async handleDeleteEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleDeleteEvent(
      llm,
      message,
      userId,
      currentDate,
      useMcpTools,
    );
  }

  private async handleUpdateTodo(
    message: string,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleUpdateTodo(message, userId, useMcpTools);
  }

  private async handleUpdateEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleUpdateEvent(
      llm,
      message,
      userId,
      currentDate,
      useMcpTools,
    );
  }

  /**
   * 处理创建待办
   */
  private async handleCreateTodo(
    llm: ChatLLM,
    message: string,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleCreateTodo(
      llm,
      message,
      userId,
      useMcpTools,
    );
  }

  /**
   * 处理创建日程
   */
  private async handleCreateEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleCreateEvent(
      llm,
      message,
      userId,
      currentDate,
      useMcpTools,
    );
  }

  /**
   * 处理查询日程
   */
  private async handleQuerySchedule(
    llm: ChatLLM,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleQuerySchedule(llm, userId, useMcpTools);
  }

  /**
   * 处理普通聊天
   */
  private async handleChat(
    llm: ChatLLM,
    message: string,
    userId: number | undefined,
    sessionId?: string,
    contextWindow = this.maxHistoryMessages,
    images?: ChatImageDto[],
    promptOverride?: string,
    /** 联网检索 digest：写入会话历史用户侧，便于多轮追问仍带事实 */
    searchDigestForHistory?: string,
    requestConfig?: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    const history = this.chatSessionService.getHistoryMessages(sessionKey);
    const scopedHistory = this.chatHistoryService.sliceHistoryForContext(
      history,
      contextWindow,
    );

    const userHuman = buildChatHumanMessage(
      promptOverride ?? this.chatResponseService.buildPrompt(message),
      images,
    );
    const skillSystem = await this.buildSkillSystemMessage(
      userId,
      requestConfig,
      message,
    );
    const skillPrefix: BaseMessage[] = skillSystem ? [skillSystem] : [];
    const result = await llm.invoke([
      ...skillPrefix,
      ...scopedHistory,
      userHuman,
    ]);

    const content =
      typeof result.content === 'string'
        ? result.content.trim()
        : result.content && typeof result.content === 'object'
          ? JSON.stringify(result.content).trim()
          : '';

    if (!content) {
      this.logger.warn(
        `[AI Chat] invoke 返回空正文，将使用 buildFallback（若使用 MiniMax M2，请检查是否应解析 reasoning_content） messageLen=${message.length}`,
      );
    }

    const finalContent = this.chatResponseService.normalizeAssistantReply(
      content || this.chatResponseService.buildFallback(message),
    );
    this.chatSessionService.appendHistory(
      sessionKey,
      buildChatHistoryUserLine(message, images, searchDigestForHistory),
      finalContent,
      this.maxHistoryMessages,
    );

    return {
      type: 'chat',
      content: finalContent,
    };
  }

  private async handleQueryWeather(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    sessionId?: string,
  ): Promise<ChatResponseDto> {
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    const weatherReply = await this.weatherService.buildWeatherResponse(
      llm,
      message,
      currentDate,
    );
    const { answer: weatherAnswer } = splitCompleteReplyThink(weatherReply);
    const contentForUser = this.chatResponseService.normalizeAssistantReply(
      weatherAnswer.trim(),
    );
    this.chatSessionService.appendHistory(
      sessionKey,
      message,
      contentForUser,
      this.maxHistoryMessages,
    );
    return {
      type: 'chat',
      content: contentForUser,
    };
  }

  /**
   * 根据意图处理
   */
  private async processByIntent(
    llm: ChatLLM,
    intent: IntentType,
    message: string,
    userId: number | undefined,
    currentDate: string,
    sessionId?: string,
    contextWindow = this.maxHistoryMessages,
    images?: ChatImageDto[],
    useMcpTools = false,
    requestConfig?: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    switch (intent) {
      case IntentType.CREATE_TODO:
        return this.handleCreateTodo(llm, message, userId, useMcpTools);
      case IntentType.CREATE_EVENT:
        return this.handleCreateEvent(
          llm,
          message,
          userId,
          currentDate,
          useMcpTools,
        );
      case IntentType.UPDATE_TODO:
        return this.handleUpdateTodo(message, userId, useMcpTools);
      case IntentType.UPDATE_EVENT:
        return this.handleUpdateEvent(
          llm,
          message,
          userId,
          currentDate,
          useMcpTools,
        );
      case IntentType.DELETE_TODO:
        return this.handleDeleteTodo(message, userId, useMcpTools);
      case IntentType.DELETE_EVENT:
        return this.handleDeleteEvent(
          llm,
          message,
          userId,
          currentDate,
          useMcpTools,
        );
      case IntentType.QUERY_SCHEDULE:
        return this.handleQuerySchedule(llm, userId, useMcpTools);
      case IntentType.QUERY_WEATHER:
        return this.handleQueryWeather(
          llm,
          message,
          userId,
          currentDate,
          sessionId,
        );
      case IntentType.CHAT:
      default:
        if (useMcpTools) {
          const userInfoResult =
            await this.chatMcpRouterService.tryHandleUserInfoViaMcp(
              message,
              userId,
              sessionId,
            );
          if (userInfoResult) {
            return userInfoResult;
          }

          const githubResult =
            await this.chatMcpRouterService.tryHandleGithubChatViaMcp(
              message,
              userId,
              sessionId,
            );
          if (githubResult) {
            return githubResult;
          }
        }
        {
          const webResolved = await this.resolveWebSearchDigestForUser(
            message,
            userId,
            useMcpTools,
          );
          if (webResolved?.kind === 'blocked') {
            return { type: 'chat', content: webResolved.text };
          }
          if (webResolved?.kind === 'digest') {
            return this.handleChat(
              llm,
              message,
              userId,
              sessionId,
              contextWindow,
              undefined,
              this.chatResponseService.buildWebSearchChatPrompt(
                message,
                webResolved.text,
              ),
              webResolved.text,
              requestConfig,
            );
          }
        }
        return this.handleChat(
          llm,
          message,
          userId,
          sessionId,
          contextWindow,
          images,
          undefined,
          undefined,
          requestConfig,
        );
    }
  }

  /**
   * CHAT 下按需走网页检索：优先 MCP `search`（与 GitHub 一致），否则回退直连 Tavily/Brave。
   */
  private async resolveWebSearchDigestForUser(
    message: string,
    userId: number | undefined,
    useMcpTools: boolean,
  ): Promise<
    { kind: 'digest'; text: string } | { kind: 'blocked'; text: string } | null
  > {
    if (!userId) return null;
    if (!shouldOfferWebSearchMcp(message)) {
      return null;
    }
    const query = message.trim();

    if (useMcpTools) {
      try {
        const result = await this.mcpServersService.callToolForUser(
          userId,
          'search',
          { query },
        );
        const first = result.content.find((item) => item.type === 'text');
        const text = first?.text?.trim();
        if (text) {
          return { kind: 'digest', text };
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : '调用失败';
        if (msg.includes('未找到可用的 MCP 工具')) {
          return {
            kind: 'blocked',
            text: '检测到你需要联网检索，但未安装或未启用「网页检索」MCP。请到 MCP 面板安装并启用网页检索能力后重试。',
          };
        }
        this.logger.warn(
          `[AI WebSearch] MCP search failed, fallback to direct API: ${msg}`,
        );
      }
    }

    try {
      const digest = await this.webSearchCore.searchDigest(query);
      return { kind: 'digest', text: digest };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { kind: 'blocked', text: msg };
    }
  }

  async getUserAIConfig(userId: number) {
    return this.aiConfigService.getUserConfig(userId);
  }

  getConfigTransportPublicKey() {
    const cfgSvc = this.aiConfigService as {
      getConfigTransportPublicKeyDerBase64: () => string;
    };
    const publicKeyDerBase64 = cfgSvc.getConfigTransportPublicKeyDerBase64();
    return {
      algorithm: 'RSA-OAEP-256',
      publicKeyDerBase64,
    };
  }

  async saveUserAIConfig(userId: number, input: SaveAIConfigDto) {
    const cfgSvc = this.aiConfigService as {
      decryptConfigTransportApiKeys: (
        encryptedApiKeys?: Partial<
          Record<
            'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen' | 'minimax',
            string
          >
        >,
      ) => Partial<
        Record<
          'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen' | 'minimax',
          string
        >
      >;
    };
    const decryptedApiKeys = cfgSvc.decryptConfigTransportApiKeys(
      (input.encryptedApiKeys || {}) as Partial<
        Record<
          'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen' | 'minimax',
          string
        >
      >,
    );
    const mergedApiKeys: Partial<
      Record<
        'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen' | 'minimax',
        string
      >
    > = {
      ...(input.apiKeys || {}),
      ...decryptedApiKeys,
    };
    return this.aiConfigService.saveUserConfig(userId, {
      provider: input.provider || 'minimax',
      model: input.model || 'MiniMax-M2.7',
      temperature: input.temperature ?? 7,
      maxTokens: input.maxTokens ?? 4096,
      contextWindow: input.contextWindow ?? this.maxHistoryMessages,
      thinkingEnabled: input.thinkingEnabled ?? false,
      thinkingBudget: input.thinkingBudget ?? 0,
      useMcpTools: input.useMcpTools ?? false,
      apiKeys: mergedApiKeys,
    });
  }

  private async buildLLM(
    userId: number | undefined,
    requestConfig?: ChatRequestDto,
  ): Promise<{ llm: ChatLLM; thinkingEnabled: boolean; useMcpTools: boolean }> {
    try {
      const runtimeConfig = {
        provider: requestConfig?.provider,
        model: requestConfig?.model,
        temperature: requestConfig?.temperature,
        maxTokens: requestConfig?.maxTokens,
        contextWindow: requestConfig?.contextWindow,
        thinkingEnabled: requestConfig?.thinkingEnabled,
        thinkingBudget: requestConfig?.thinkingBudget,
        useMcpTools: requestConfig?.useMcpTools,
      };

      const resolvedModelConfig = userId
        ? await this.aiConfigService.resolveModelConfig(userId, runtimeConfig)
        : this.aiConfigService.resolveDefaultConfig(runtimeConfig);

      return {
        llm: new UniversalChatLLM(resolvedModelConfig),
        thinkingEnabled: Boolean(resolvedModelConfig.thinkingEnabled),
        useMcpTools: Boolean(resolvedModelConfig.useMcpTools),
      };
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'AI model config is invalid',
      );
    }
  }
}
