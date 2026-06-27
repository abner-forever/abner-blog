import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UniversalChatLLM } from './langchain/model';
import type { ChatLLM } from './langchain/model';
import { AgentProcessor } from './agent/agent.processor';
import { ChatResponseDto } from './dto/extraction-result.dto';
import { AIConfigService } from './services/ai-config.service';
import { ChatRequestDto, SaveAIConfigDto } from './dto/chat.dto';
import { mapLlmErrorForUser } from './utils/llm-user-facing-error';
import type { AIStreamEvent } from './orchestrator/types';

@Injectable()
export class AIService {
  constructor(
    private readonly aiConfigService: AIConfigService,
    private readonly agentProcessor: AgentProcessor,
  ) {}

  /**
   * 处理用户消息（非流式）
   *
   * 收集 processMessageStream 的所有流式事件后合并为 ChatResponseDto。
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
   *
   * AgentProcessor 仅产生 chat_delta / done / error 事件，因此只关心 chat_delta 拼接与错误提取。
   */
  private eventsToResponse(events: AIStreamEvent[]): ChatResponseDto {
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

    const chatContent = events
      .filter((e) => e.event === 'chat_delta')
      .map((e) => (e.payload?.delta as string) || '')
      .join('');
    return chatContent
      ? { type: 'chat', content: chatContent }
      : { type: 'chat', content: undefined };
  }

  /**
   * 处理用户消息（流式）
   *
   * 委托给 AgentProcessor（LangGraph Agent Workflow），
   * 替代原有的 if/else + 意图检测路由。
   * Agent 工作流自动处理：工具调用（todo/event/weather/web/kb/MCP）、
   * 知识库检索、联网搜索、历史管理、think-tag 解析和流式输出。
   */
  async *processMessageStream(
    message: string,
    userId: number | undefined,
    currentDate: string = new Date().toISOString(),
    sessionId?: string,
    requestConfig?: ChatRequestDto,
  ): AsyncGenerator<AIStreamEvent> {
    try {
      const { llm } = await this.buildLLM(userId, requestConfig);
      yield* this.agentProcessor.processMessageStream(
        message,
        userId,
        llm,
        currentDate,
        sessionId,
        requestConfig,
        requestConfig?.images,
      );
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
      contextWindow: input.contextWindow ?? 10,
      thinkingEnabled: input.thinkingEnabled ?? false,
      thinkingBudget: input.thinkingBudget ?? 0,
      apiKeys: mergedApiKeys,
    });
  }

  private async buildLLM(
    userId: number | undefined,
    requestConfig?: ChatRequestDto,
  ): Promise<{ llm: ChatLLM; thinkingEnabled: boolean }> {
    try {
      const runtimeConfig = {
        provider: requestConfig?.provider,
        model: requestConfig?.model,
        temperature: requestConfig?.temperature,
        maxTokens: requestConfig?.maxTokens,
        contextWindow: requestConfig?.contextWindow,
        thinkingEnabled: requestConfig?.thinkingEnabled,
        thinkingBudget: requestConfig?.thinkingBudget,
      };

      const resolvedModelConfig = userId
        ? await this.aiConfigService.resolveModelConfig(userId, runtimeConfig)
        : this.aiConfigService.resolveDefaultConfig(runtimeConfig);

      return {
        llm: new UniversalChatLLM(resolvedModelConfig),
        thinkingEnabled: Boolean(resolvedModelConfig.thinkingEnabled),
      };
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'AI model config is invalid',
      );
    }
  }
}
