import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { UniversalChatLLM } from './langchain/model';
import type { ChatLLM } from './langchain/model';
import { detectIntent, extractWeatherQueryContext } from './langchain/chains';
import { IntentType, ChatResponseDto } from './dto/extraction-result.dto';
import { CHAT_STREAM_CHUNK_SIZE } from './constants';
import { buildScheduleSummary } from './utils/response-builders';
import { splitTextToChunks } from './utils/text';
import { AICommandService } from './services/ai-command.service';
import { AIConfigService } from './services/ai-config.service';
import type { ChatImageDto } from './dto/chat.dto';
import { ChatRequestDto, SaveAIConfigDto } from './dto/chat.dto';
import { buildChatHumanMessage } from './utils/build-chat-human-message';
import { AIChatSessionService } from './services/ai-chat-session.service';
import { AIWeatherService } from './services/ai-weather.service';
import { AIChatResponseService } from './services/ai-chat-response.service';
import { AIWebSearchService } from './services/ai-web-search.service';
import {
  splitCompleteReplyThink,
  splitThinkTaggedDelta,
  type ThinkTagSplitState,
} from './utils/think-tag-split';
import { McpService } from '../mcp/mcp.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

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
    | 'done'
    | 'error';
  payload?: Record<string, unknown>;
}

const MAX_CHAT_IMAGE_BYTES = 4 * 1024 * 1024;

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
    private readonly webSearchService: AIWebSearchService,
    private readonly mcpService: McpService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {
    // 兼容旧部署：允许通过用户配置或请求内 apiKey 注入。
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
        return '';
      }
      const contextParts = results.map(
        (r, i) => `[知识库${i + 1}] ${r.content}`,
      );
      return `以下是知识库中相关信息，请结合回答：\n${contextParts.join('\n')}`;
    } catch (error) {
      this.logger.warn(`Knowledge base search failed: ${error}`);
      return '';
    }
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
      this.validateChatImages(requestConfig?.images);
      const { llm } = await this.buildLLM(userId, requestConfig);
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
      );
      this.appendIntentResultToHistoryIfNeeded(
        intent,
        this.toHistoryUserText(message, requestConfig?.images),
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
        error: error instanceof Error ? error.message : '处理消息时发生错误',
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
      this.validateChatImages(requestConfig?.images);
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
        const sessionKey = this.chatSessionService.getSessionKey(
          userId,
          sessionId,
        );
        let weatherAnswer = '';

        if (useMcpTools) {
          const mcpWeatherFacts = await this.buildWeatherResponseViaMcp(
            llm,
            message,
            currentDate,
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
              for (const chunk of splitTextToChunks(
                weatherAnswer,
                CHAT_STREAM_CHUNK_SIZE,
              )) {
                yield { event: 'chat_delta', payload: { delta: chunk } };
              }
              hasDelta = true;
            }
            if (!hasDelta) {
              weatherAnswer = mcpWeatherFacts;
              for (const chunk of splitTextToChunks(
                weatherAnswer,
                CHAT_STREAM_CHUNK_SIZE,
              )) {
                yield { event: 'chat_delta', payload: { delta: chunk } };
              }
            }
          }
        } else {
          const weatherContent = await this.weatherService.buildWeatherResponse(
            llm,
            message,
            currentDate,
          );
          weatherAnswer = splitCompleteReplyThink(weatherContent).answer;
          const chunks = splitTextToChunks(
            weatherAnswer,
            CHAT_STREAM_CHUNK_SIZE,
          );
          for (const chunk of chunks) {
            yield { event: 'chat_delta', payload: { delta: chunk } };
          }
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
        yield { event: 'done', payload: { type: 'chat' } };
        return;
      }

      if (intent === IntentType.CHAT || intent === IntentType.WEB_SEARCH) {
        let promptForLlm: string;
        if (intent === IntentType.WEB_SEARCH) {
          const prepared = await this.webSearchService.preparePrompt(message);
          if (prepared.ok === false) {
            const sessionKeyEarly = this.chatSessionService.getSessionKey(
              userId,
              sessionId,
            );
            const errText = prepared.message;
            this.chatSessionService.appendHistory(
              sessionKeyEarly,
              this.toHistoryUserText(message, requestConfig?.images),
              errText,
              this.maxHistoryMessages,
            );
            const errChunks = splitTextToChunks(
              errText,
              CHAT_STREAM_CHUNK_SIZE,
            );
            for (const chunk of errChunks) {
              yield { event: 'chat_delta', payload: { delta: chunk } };
            }
            yield { event: 'done', payload: { type: 'chat' } };
            return;
          }
          promptForLlm = prepared.prompt;
        } else {
          const kbContext = await this.buildKnowledgeBaseContext(
            message,
            userId,
          );
          const basePrompt = this.chatResponseService.buildPrompt(message);
          promptForLlm = kbContext
            ? `${kbContext}\n\n${basePrompt}`
            : basePrompt;
        }
        const sessionKey = this.chatSessionService.getSessionKey(
          userId,
          sessionId,
        );
        const history = this.chatSessionService.getHistoryMessages(sessionKey);
        const scopedHistory = history.slice(-contextWindow);
        let hasDelta = false;
        let fullReply = '';
        const generationStart = Date.now();
        let firstDeltaLogged = false;
        const thinkTagState: ThinkTagSplitState = {
          inThink: false,
          pending: '',
        };
        const userHuman = buildChatHumanMessage(
          promptForLlm,
          intent === IntentType.CHAT ? requestConfig?.images : undefined,
        );
        const imageCount =
          intent === IntentType.WEB_SEARCH
            ? 0
            : (requestConfig?.images?.length ?? 0);
        this.logger.log(
          `[AI Chat] stream_start userId=${userId} provider=${requestConfig?.provider ?? '?'} model=${requestConfig?.model ?? '?'} images=${imageCount} messageLen=${message.length}`,
        );
        for await (const streamChunk of llm.invokeStream([
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
            yield {
              event: 'thinking_delta',
              payload: { delta: thinkingDelta },
            };
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
            intent === IntentType.CHAT ? requestConfig?.images : undefined,
            intent === IntentType.WEB_SEARCH ? promptForLlm : undefined,
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
          const chunks = splitTextToChunks(
            answerContent,
            CHAT_STREAM_CHUNK_SIZE,
          );
          for (const chunk of chunks) {
            yield { event: 'chat_delta', payload: { delta: chunk } };
          }
        } else {
          this.chatSessionService.appendHistory(
            sessionKey,
            this.toHistoryUserText(message, requestConfig?.images),
            this.chatResponseService.normalizeAssistantReply(fullReply.trim()),
            this.maxHistoryMessages,
          );
        }
        this.logger.log(
          `[AI Chat] stream_end hasDelta=${hasDelta} replyLen=${hasDelta ? fullReply.trim().length : 'n/a'}`,
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
      );
      this.appendIntentResultToHistoryIfNeeded(
        intent,
        this.toHistoryUserText(message, requestConfig?.images),
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
          error: error instanceof Error ? error.message : '处理消息时发生错误',
        },
      };
    }
  }

  private async handleDeleteTodo(
    message: string,
    userId: number,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleDeleteTodo(message, userId);
  }

  private async handleDeleteEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleDeleteEvent(
      llm,
      message,
      userId,
      currentDate,
    );
  }

  private async handleUpdateTodo(
    message: string,
    userId: number,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleUpdateTodo(message, userId);
  }

  private async handleUpdateEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleUpdateEvent(
      llm,
      message,
      userId,
      currentDate,
    );
  }

  /**
   * 处理创建待办
   */
  private async handleCreateTodo(
    llm: ChatLLM,
    message: string,
    userId: number,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleCreateTodo(llm, message, userId);
  }

  /**
   * 处理创建日程
   */
  private async handleCreateEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleCreateEvent(
      llm,
      message,
      userId,
      currentDate,
    );
  }

  /**
   * 处理查询日程
   */
  private async handleQuerySchedule(
    llm: ChatLLM,
    userId: number,
  ): Promise<ChatResponseDto> {
    return this.aiCommandService.handleQuerySchedule(llm, userId);
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
  ): Promise<ChatResponseDto> {
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    const history = this.chatSessionService.getHistoryMessages(sessionKey);
    const scopedHistory = history.slice(-contextWindow);

    const userHuman = buildChatHumanMessage(
      promptOverride ?? this.chatResponseService.buildPrompt(message),
      images,
    );
    const result = await llm.invoke([...scopedHistory, userHuman]);

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
      this.toHistoryUserText(message, images),
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
        const result = await this.mcpService.callTool('get_weather', {
          city,
          date: targetDate,
        });
        const firstContent = result.content?.[0];
        const localText =
          firstContent?.type === 'text' ? firstContent.text : '获取天气信息失败';
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
    // CHAT / QUERY_WEATHER / WEB_SEARCH 分支已在各自处理函数中写入历史，这里避免重复写入。
    if (
      intent === IntentType.CHAT ||
      intent === IntentType.QUERY_WEATHER ||
      intent === IntentType.WEB_SEARCH
    ) {
      return;
    }
    const assistantReply = this.buildIntentMemoryReply(result);
    if (!assistantReply) return;
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    this.chatSessionService.appendHistory(
      sessionKey,
      userMessage,
      assistantReply,
      this.maxHistoryMessages,
    );
  }

  private buildIntentMemoryReply(result: ChatResponseDto): string | null {
    const data = result.data || {};
    const title = this.getStringField(data, 'title');
    const id = this.getNumberField(data, 'id');

    switch (result.type) {
      case 'todo_created':
        return title ? `已创建待办：${title}。` : '已创建一个新的待办事项。';
      case 'event_created':
        return title ? `已创建日程：${title}。` : '已创建一个新的日程。';
      case 'todo_updated':
        return title ? `已更新待办：${title}。` : '已更新一个待办事项。';
      case 'event_updated':
        return title ? `已更新日程：${title}。` : '已更新一个日程。';
      case 'todo_deleted':
        if (title) return `已删除待办：${title}。`;
        if (typeof id === 'number') return `已删除待办（ID：${id}）。`;
        return '已删除一个待办事项。';
      case 'event_deleted':
        if (title) return `已删除日程：${title}。`;
        if (typeof id === 'number') return `已删除日程（ID：${id}）。`;
        return '已删除一个日程。';
      case 'schedule_query':
        return buildScheduleSummary(result.scheduleData);
      case 'clarification_needed': {
        const suggestion = result.clarification?.suggestion?.trim();
        if (suggestion) return `我需要你补充信息后才能继续：${suggestion}`;
        return '我需要补充信息后才能继续处理这个请求。';
      }
      case 'error':
        return result.error?.trim()
          ? `处理该请求时遇到问题：${result.error.trim()}`
          : '处理该请求时遇到问题。';
      case 'chat':
      default:
        return null;
    }
  }

  private getStringField(
    data: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = data[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private getNumberField(
    data: Record<string, unknown>,
    key: string,
  ): number | null {
    const value = data[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
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
  ): Promise<ChatResponseDto> {
    switch (intent) {
      case IntentType.CREATE_TODO:
        return this.handleCreateTodo(llm, message, userId);
      case IntentType.CREATE_EVENT:
        return this.handleCreateEvent(llm, message, userId, currentDate);
      case IntentType.UPDATE_TODO:
        return this.handleUpdateTodo(message, userId);
      case IntentType.UPDATE_EVENT:
        return this.handleUpdateEvent(llm, message, userId, currentDate);
      case IntentType.DELETE_TODO:
        return this.handleDeleteTodo(message, userId);
      case IntentType.DELETE_EVENT:
        return this.handleDeleteEvent(llm, message, userId, currentDate);
      case IntentType.QUERY_SCHEDULE:
        return this.handleQuerySchedule(llm, userId);
      case IntentType.QUERY_WEATHER:
        return this.handleQueryWeather(
          llm,
          message,
          userId,
          currentDate,
          sessionId,
        );
      case IntentType.WEB_SEARCH: {
        const prep = await this.webSearchService.preparePrompt(message);
        if (prep.ok === false) {
          return { type: 'chat', content: prep.message };
        }
        return this.handleChat(
          llm,
          message,
          userId,
          sessionId,
          contextWindow,
          undefined,
          prep.prompt,
        );
      }
      case IntentType.CHAT:
      default:
        return this.handleChat(
          llm,
          message,
          userId,
          sessionId,
          contextWindow,
          images,
        );
    }
  }

  private validateChatImages(images?: ChatImageDto[]): void {
    if (!images?.length) return;
    for (const img of images) {
      const buf = Buffer.from(img.dataBase64, 'base64');
      if (!buf.length || buf.length > MAX_CHAT_IMAGE_BYTES) {
        throw new BadRequestException(
          `单张图片过大或无效，请压缩后重试（最大 ${MAX_CHAT_IMAGE_BYTES / 1024 / 1024}MB）`,
        );
      }
    }
  }

  private toHistoryUserText(message: string, images?: ChatImageDto[]): string {
    const text = message.trim();
    if (images?.length) {
      const tag = `[图片×${images.length}]`;
      return text ? `${tag} ${text}` : tag;
    }
    return text;
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
