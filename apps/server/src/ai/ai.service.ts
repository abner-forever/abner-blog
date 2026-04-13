import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { UniversalChatLLM } from './langchain/model';
import type { ChatLLM } from './langchain/model';
import { detectIntent, extractWeatherQueryContext } from './langchain/chains';
import { IntentType, ChatResponseDto } from './dto/extraction-result.dto';
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
  type ThinkTagSplitState,
} from './utils/think-tag-split';
import { buildIntentMemoryReply } from './utils/chat-history';
import {
  extractGithubIssueDraft,
  extractGithubOwnerRepo,
} from './utils/github-chat';
import {
  buildChatHistoryUserLine,
  toHistoryUserText,
  validateChatImages,
} from './utils/chat-images';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { McpService, MCPServersService } from '../mcp';
import { SkillsService } from '../skills/skills.service';

export interface AIStreamEvent {
  event:
    | 'intent'
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

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly maxHistoryMessages = 10;

  // MCP session 状态（维护已初始化的 session）
  private static mcpSessionInitialized = false;
  private static mcpSessionId: string | null = null;
  private static mcpProtocolVersion = '2025-03-26';

  constructor(
    private readonly aiCommandService: AICommandService,
    private readonly aiConfigService: AIConfigService,
    private readonly chatSessionService: AIChatSessionService,
    private readonly weatherService: AIWeatherService,
    private readonly chatResponseService: AIChatResponseService,
    private readonly webSearchCore: WebSearchService,
    private readonly mcpService: McpService,
    private readonly mcpServersService: MCPServersService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly skillsService: SkillsService,
  ) {
    // 兼容旧部署：允许通过用户配置或请求内 apiKey 注入。
  }

  /**
   * 取最近若干条 BaseMessage 供 LLM；保证条数为偶数，避免从半截 AIMessage 起截导致上下文错位。
   */
  private sliceHistoryForContext(
    history: BaseMessage[],
    contextWindow: number,
  ): BaseMessage[] {
    if (!history.length) return [];
    const capped = Math.min(history.length, Math.max(1, contextWindow));
    let take = capped % 2 === 0 ? capped : capped - 1;
    if (take < 2 && history.length >= 2) take = 2;
    if (take < 1) take = 1;
    return history.slice(-take);
  }

  /**
   * 搜索用户知识库并构建上下文字符串
   */
  private async buildKnowledgeBaseContext(
    message: string,
    userId: number,
  ): Promise<string> {
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
    userId: number,
    requestConfig: ChatRequestDto | undefined,
    userMessage: string,
  ): Promise<SystemMessage | null> {
    const text = await this.skillsService.buildSystemPromptForChat(
      userId,
      requestConfig?.skillId,
      userMessage,
    );
    return text ? new SystemMessage(text) : null;
  }

  /**
   * 处理用户消息（非流式）
   */
  async processMessage(
    message: string,
    userId: number,
    currentDate: string = new Date().toISOString(),
    sessionId?: string,
    requestConfig?: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    try {
      validateChatImages(requestConfig?.images);
      const { llm, useMcpTools } = await this.buildLLM(userId, requestConfig);
      const contextWindow =
        requestConfig?.contextWindow ?? this.maxHistoryMessages;
      const hasImages = Boolean(requestConfig?.images?.length);
      const intent = hasImages
        ? IntentType.CHAT
        : await detectIntent(llm, message);
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
      this.appendIntentResultToHistoryIfNeeded(
        intent,
        toHistoryUserText(message, requestConfig?.images),
        userId,
        sessionId,
        result,
      );
      return result;
    } catch (error) {
      console.error('AI Service error:', error);
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
   * 处理用户消息（流式）
   */
  async *processMessageStream(
    message: string,
    userId: number,
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
      const useChatFastPath =
        !hasImages && this.chatResponseService.shouldUseFastPath(message);
      const intent =
        useChatFastPath || hasImages
          ? IntentType.CHAT
          : await detectIntent(llm, message);
      process.stderr.write(
        `[AI Stream] Intent resolved: ${intent}, via=${useChatFastPath ? 'fast_path' : 'detect_intent'}, cost=${Date.now() - streamStart}ms\n`,
      );
      yield { event: 'intent', payload: { intent } };

      if (intent === IntentType.QUERY_WEATHER) {
        yield* this.streamWeatherIntent(
          llm,
          message,
          userId,
          currentDate,
          sessionId,
          useMcpTools,
        );
        yield { event: 'done', payload: { type: 'chat' } };
        return;
      }

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
      this.appendIntentResultToHistoryIfNeeded(
        intent,
        toHistoryUserText(message, requestConfig?.images),
        userId,
        sessionId,
        result,
      );
      yield {
        event: result.type as AIStreamEvent['event'],
        payload: {
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

  private async *streamWeatherIntent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    sessionId: string | undefined,
    useMcpTools: boolean,
  ): AsyncGenerator<AIStreamEvent> {
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    let weatherAnswer = '';

    if (useMcpTools) {
      const mcpWeatherFacts = await this.buildWeatherResponseViaMcp(
        llm,
        message,
        currentDate,
        userId,
      );
      const synthMessages =
        this.weatherService.buildMcpWeatherUserReplyMessages(
          message,
          mcpWeatherFacts,
        );
      if (!synthMessages) {
        weatherAnswer = mcpWeatherFacts;
      } else {
        const thinkTagState: ThinkTagSplitState = {
          inThink: false,
          pending: '',
        };
        let hasDelta = false;
        try {
          for await (const streamChunk of llm.invokeStream(synthMessages)) {
            const tagged = splitThinkTaggedDelta(
              streamChunk.answerDelta,
              thinkTagState,
            );
            const delta = tagged.answerDelta;
            if (!delta) continue;
            const appendDelta =
              this.chatResponseService.extractIncrementalDelta(
                weatherAnswer,
                delta,
              );
            if (!appendDelta) continue;
            hasDelta = true;
            weatherAnswer += appendDelta;
            yield { event: 'chat_delta', payload: { delta: appendDelta } };
          }
        } catch (err) {
          this.logger.warn(
            `[AI Weather] stream synthesis failed, fallback to tool facts: ${String(err)}`,
          );
          weatherAnswer = mcpWeatherFacts;
          yield* this.emitChatDeltaChunks(weatherAnswer);
          hasDelta = true;
        }
        if (!hasDelta) {
          weatherAnswer = mcpWeatherFacts;
          yield* this.emitChatDeltaChunks(weatherAnswer);
        }
      }
    } else {
      const weatherContent = await this.weatherService.buildWeatherResponse(
        llm,
        message,
        currentDate,
      );
      weatherAnswer = splitCompleteReplyThink(weatherContent).answer;
      yield* this.emitChatDeltaChunks(weatherAnswer);
    }

    const historyReply = this.chatResponseService.normalizeAssistantReply(
      weatherAnswer.trim(),
    );
    this.chatSessionService.appendHistory(
      sessionKey,
      message,
      historyReply,
      this.maxHistoryMessages,
    );
  }

  private async *streamChatOrSearchIntent(
    llm: ChatLLM,
    message: string,
    userId: number,
    sessionId: string | undefined,
    useMcpTools: boolean,
    requestConfig: ChatRequestDto | undefined,
    contextWindow: number,
    thinkingEnabled: boolean,
  ): AsyncGenerator<AIStreamEvent> {
    if (useMcpTools) {
      const githubResult = await this.tryHandleGithubChatViaMcp(
        message,
        userId,
        sessionId,
      );
      if (githubResult) {
        yield* this.emitChatDeltaChunks(githubResult.content);
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
      yield* this.emitChatDeltaChunks(webSearchResolved.text);
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
    userId: number,
    sessionId: string | undefined,
    requestConfig: ChatRequestDto | undefined,
    contextWindow: number,
    thinkingEnabled: boolean,
    options?: { searchDigestFromMcp?: string },
  ): AsyncGenerator<AIStreamEvent> {
    let promptForLlm: string;
    if (options?.searchDigestFromMcp) {
      this.logger.log(
        `[KB RAG] userId=${userId} path=web_digest skip_vector_kb=true`,
      );
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
    const scopedHistory = this.sliceHistoryForContext(history, contextWindow);
    let hasDelta = false;
    let fullReply = '';
    const generationStart = Date.now();
    let firstDeltaLogged = false;
    const thinkTagState: ThinkTagSplitState = {
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
      yield* this.emitChatDeltaChunks(answerContent);
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

  private *emitChatDeltaChunks(content: string): Generator<AIStreamEvent> {
    const chunks = splitTextToChunks(content, CHAT_STREAM_CHUNK_SIZE);
    for (const chunk of chunks) {
      yield { event: 'chat_delta', payload: { delta: chunk } };
    }
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
    userId: number,
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
    const scopedHistory = this.sliceHistoryForContext(history, contextWindow);

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
   * 通过 MCP 协议调用天气工具，并用 LLM 结合用户原话生成回复（覆盖运动/出行等延伸问法）
   */
  private async buildWeatherResponseViaMcp(
    llm: ChatLLM,
    message: string,
    currentDate: string,
    userId: number,
  ): Promise<string> {
    const protocolVersion = AIService.mcpProtocolVersion;
    const mcpUrl =
      process.env.MCP_SERVER_URL || 'http://localhost:8080/api/mcp';

    // 获取已保存的 sessionId（如果已初始化则不复用）
    let serverSessionId = AIService.mcpSessionId || 'shared-session';
    const weatherQueryContext = await extractWeatherQueryContext(
      llm,
      message,
      currentDate,
    );
    const city = weatherQueryContext.city || '北京';
    const targetDate = weatherQueryContext.date;

    try {
      if (this.shouldUseInProcessMcpTransport(mcpUrl)) {
        const result = await this.mcpServersService.callToolForUser(
          userId,
          'get_weather',
          {
            city,
            date: targetDate,
          },
        );
        const firstContent = result.content?.[0];
        const localText =
          firstContent?.type === 'text'
            ? firstContent.text
            : '获取天气信息失败';
        this.logger.log(
          `[MCP Weather][in-process] City: ${city}, Result: ${localText.substring(0, 50)}...`,
        );
        return localText;
      }

      // 1. 仅在未初始化时才发送 initialize 请求
      if (!AIService.mcpSessionInitialized) {
        const initResponse = await axios.post(
          mcpUrl,
          {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion,
              capabilities: {},
              clientInfo: { name: 'abner-blog-ai', version: '1.0.0' },
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
            },
            validateStatus: () => true,
          },
        );
        this.logger.debug(`MCP init response status: ${initResponse.status}`);

        // 检查初始化是否成功
        if (initResponse.status !== 200) {
          const errorData: unknown = initResponse.data;
          let errorMsg = `MCP 初始化失败，状态码: ${initResponse.status}`;
          if (errorData && typeof errorData === 'object') {
            const maybeError = (errorData as { error?: unknown }).error;
            if (maybeError && typeof maybeError === 'object') {
              const maybeMessage = (maybeError as { message?: unknown })
                .message;
              if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
                errorMsg = maybeMessage;
              }
            }
          }
          this.logger.error(`[MCP Weather] Init failed: ${errorMsg}`);
          return errorMsg;
        }

        // 从响应头获取服务端分配的 sessionId
        serverSessionId =
          (initResponse.headers['mcp-session-id'] as string) ||
          'shared-session';
        AIService.mcpSessionId = serverSessionId;
        AIService.mcpSessionInitialized = true;
        this.logger.debug(
          `MCP initialized: sessionId=${serverSessionId}, protocolVersion=${protocolVersion}`,
        );

        // 2. 发送 initialized 通知（不等待响应）
        axios
          .post(
            mcpUrl,
            { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
                'mcp-session-id': serverSessionId,
                'mcp-protocol-version': protocolVersion,
              },
              validateStatus: () => true,
            },
          )
          .catch((err: { message: string }) => {
            this.logger.warn(
              `MCP notification error (ignored): ${err.message}`,
            );
          });

        // 等待一小段时间确保通知被处理
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        this.logger.debug(
          `MCP using existing session: sessionId=${serverSessionId}`,
        );
      }

      // 3. 调用 get_weather 工具
      const response = await axios.post(
        mcpUrl,
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'get_weather',
            arguments: { city, date: targetDate },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'mcp-session-id': serverSessionId,
            'mcp-protocol-version': protocolVersion,
          },
          timeout: 30000,
          validateStatus: () => true,
        },
      );

      // 4. 解析响应
      /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const data: any = response.data;
      let resultText = '获取天气信息失败';

      if (typeof data === 'string' && data.includes('data:')) {
        // SSE 格式响应
        const jsonMatch = data.match(/data: (\{.*\})/);
        if (jsonMatch) {
          const parsed: any = JSON.parse(jsonMatch[1]);
          if (parsed.result?.content?.[0]?.text) {
            resultText = parsed.result.content[0].text;
          }
        }
      } else if (data?.result?.content?.[0]?.text) {
        resultText = data.result.content[0].text;
      }
      /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

      this.logger.log(
        `[MCP Weather] City: ${city}, Result: ${resultText.substring(0, 50)}...`,
      );
      return resultText;
    } catch (error) {
      this.logger.error(`[MCP Weather] Error: ${error}`);
      return `通过 MCP 获取天气信息失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  }

  private shouldUseInProcessMcpTransport(mcpUrl: string): boolean {
    if (!mcpUrl) return true;
    return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/api\/mcp\/?$/.test(
      mcpUrl,
    );
  }

  private appendIntentResultToHistoryIfNeeded(
    intent: IntentType,
    userMessage: string,
    userId: number,
    sessionId: string | undefined,
    result: ChatResponseDto,
  ): void {
    // CHAT / QUERY_WEATHER 分支已在各自处理函数中写入历史，这里避免重复写入。
    if (intent === IntentType.CHAT || intent === IntentType.QUERY_WEATHER) {
      return;
    }
    const assistantReply = buildIntentMemoryReply(result);
    if (!assistantReply) return;
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    this.chatSessionService.appendHistory(
      sessionKey,
      userMessage,
      assistantReply,
      this.maxHistoryMessages,
    );
  }

  /**
   * 根据意图处理
   */
  private async processByIntent(
    llm: ChatLLM,
    intent: IntentType,
    message: string,
    userId: number,
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
          const githubResult = await this.tryHandleGithubChatViaMcp(
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
    userId: number,
    useMcpTools: boolean,
  ): Promise<
    { kind: 'digest'; text: string } | { kind: 'blocked'; text: string } | null
  > {
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

  private async tryHandleGithubChatViaMcp(
    message: string,
    userId: number,
    sessionId?: string,
  ): Promise<ChatResponseDto | null> {
    const ownerRepoMatch = extractGithubOwnerRepo(message);
    if (!ownerRepoMatch) return null;

    const owner = ownerRepoMatch.owner;
    const repo = ownerRepoMatch.repo;
    const lower = message.toLowerCase();
    const askIssue =
      lower.includes('issue') ||
      message.includes('问题单') ||
      message.includes('缺陷');
    const createIssueIntent =
      (lower.includes('issue') &&
        (lower.includes('create') ||
          lower.includes('open') ||
          lower.includes('file'))) ||
      message.includes('提个问题') ||
      message.includes('提个issue') ||
      message.includes('提 issue') ||
      message.includes('创建issue') ||
      message.includes('创建 issue') ||
      message.includes('新建issue') ||
      message.includes('报个 bug') ||
      message.includes('报bug');
    const askPr =
      /\bpr\b/.test(lower) ||
      lower.includes('pull request') ||
      message.includes('合并请求');
    const askRepo =
      lower.includes('repo') ||
      lower.includes('repository') ||
      message.includes('仓库');
    const hasGithubHint =
      lower.includes('github') ||
      askIssue ||
      askPr ||
      askRepo ||
      message.includes('仓库');
    if (!hasGithubHint) return null;

    let toolName = askIssue ? 'list_issues' : askPr ? 'list_prs' : 'get_repo';
    let params: Record<string, unknown> = {
      owner,
      repo,
      ...(askIssue || askPr ? { state: 'open', per_page: 10 } : {}),
    };

    if (createIssueIntent) {
      const draft = extractGithubIssueDraft(message);
      if (!draft?.title) {
        return {
          type: 'chat',
          content:
            '我已识别到你想创建 GitHub Issue，请补充标题，例如：在 owner/repo 提个 issue，标题是“首页无法访问”，内容是“访问 / 返回 404”。',
        };
      }
      toolName = 'create_issue';
      params = {
        owner,
        repo,
        title: draft.title,
        body: draft.body || undefined,
      };
    }

    try {
      const result = await this.mcpServersService.callToolForUser(
        userId,
        toolName,
        params,
      );
      const first = result.content.find((item) => item.type === 'text');
      const content =
        first?.text?.trim() ||
        `已通过 GitHub MCP 调用 ${toolName}，但未返回可展示文本。`;
      const normalized =
        this.chatResponseService.normalizeAssistantReply(content);
      const sessionKey = this.chatSessionService.getSessionKey(
        userId,
        sessionId,
      );
      this.chatSessionService.appendHistory(
        sessionKey,
        message,
        normalized,
        this.maxHistoryMessages,
      );
      return { type: 'chat', content: normalized };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '调用失败';
      if (msg.includes('未找到可用的 MCP 工具')) {
        return {
          type: 'chat',
          content:
            '检测到你在查询 GitHub 信息，但当前未安装或未启用 GitHub MCP 工具。请到 MCP 面板安装并启用 GitHub 集成后重试。',
        };
      }
      return {
        type: 'chat',
        content: `已识别为 GitHub 请求，但 MCP 调用失败：${msg}`,
      };
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
    userId: number,
    requestConfig?: ChatRequestDto,
  ): Promise<{ llm: ChatLLM; thinkingEnabled: boolean; useMcpTools: boolean }> {
    try {
      const resolvedModelConfig = await this.aiConfigService.resolveModelConfig(
        userId,
        {
          provider: requestConfig?.provider,
          model: requestConfig?.model,
          temperature: requestConfig?.temperature,
          maxTokens: requestConfig?.maxTokens,
          contextWindow: requestConfig?.contextWindow,
          thinkingEnabled: requestConfig?.thinkingEnabled,
          thinkingBudget: requestConfig?.thinkingBudget,
          useMcpTools: requestConfig?.useMcpTools,
        },
      );
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
