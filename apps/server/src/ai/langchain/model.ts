import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { Logger } from '@nestjs/common';
import { appendAiStreamDebugLine } from '../utils/ai-stream-debug';
import { LLM_TIMEOUT_MS } from '../utils/timeout';
import { z } from 'zod/v3';

const minimaxDebugLogger = new Logger('AI-LLM-MiniMax');

function isAiChatDebug(): boolean {
  return process.env.AI_CHAT_DEBUG === '1';
}

/** 同步写入排错文件，并按条数节制输出到 Nest 日志，避免刷屏 */
function minimaxDebug(line: string, nestLog: boolean): void {
  appendAiStreamDebugLine(line);
  if (nestLog && isAiChatDebug()) {
    minimaxDebugLogger.log(line);
  }
}
export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'qwen'
  | 'minimax';

type MultimodalContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface ToolCallPayload {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null | MultimodalContentPart[];
  tool_calls?: ToolCallPayload[];
  tool_call_id?: string;
}

/**
 * OpenAI 兼容的工具定义格式（tools 参数）
 */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatModelConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
}

export interface MiniMaxInput {
  apiKey?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface MiniMaxRequestBody {
  model: string;
  messages: ChatMessagePayload[];
  temperature: number;
  max_completion_tokens?: number;
  max_tokens?: number;
  stream: boolean;
  reasoning?: {
    effort: 'low' | 'medium' | 'high';
    budget: number;
  };
}
export interface LLMCallOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  tools?: ToolDefinition[];
}

export interface LLMStreamChunk {
  answerDelta: string;
  reasoningDelta: string;
}

export interface ChatLLM {
  invoke(messages: BaseMessage[], options?: LLMCallOptions): Promise<AIMessage>;
  invokeStream(
    messages: BaseMessage[],
    options?: LLMCallOptions,
  ): AsyncGenerator<LLMStreamChunk>;
}

export class UniversalChatLLM implements ChatLLM {
  private readonly cfg: Required<Omit<ChatModelConfig, 'apiKey'>> & {
    apiKey: string;
  };

  constructor(config: ChatModelConfig) {
    if (!config.apiKey) {
      throw new Error('Model apiKey is required');
    }
    this.cfg = {
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      temperature: clampTemperature(config.temperature ?? 0.7),
      maxTokens: config.maxTokens ?? 4096,
      thinkingEnabled: config.thinkingEnabled ?? false,
      thinkingBudget: config.thinkingBudget ?? 0,
    };
  }

  async invoke(
    messages: BaseMessage[],
    options?: LLMCallOptions,
  ): Promise<AIMessage> {
    const timeoutMs = options?.signal
      ? undefined // 外部 signal 优先，不覆盖
      : (LLM_TIMEOUT_MS[this.cfg.provider] ?? 60_000);
    const invokeOpts = timeoutMs
      ? { ...options, signal: AbortSignal.timeout(timeoutMs) }
      : options;
    const payload = await this.requestJson(messages, {
      ...invokeOpts,
      stream: false,
      tools: options?.tools,
    });

    // ⭐ 优先检查原生 tool_calls（OpenAI 兼容格式）
    const toolCalls = extractToolCalls(payload);
    if (toolCalls && toolCalls.length > 0) {
      return new AIMessage({
        content: '',
        tool_calls: toolCalls,
      });
    }

    const content = extractUniversalText(
      payload,
      this.cfg.provider,
      this.cfg.thinkingEnabled,
    );
    if (
      this.cfg.provider === 'minimax' &&
      isAiChatDebug() &&
      !(typeof content === 'string' && content.trim())
    ) {
      const line = `invoke_empty_body ${summarizeMiniMaxJsonPayload(payload)}`;
      minimaxDebug(line, true);
    }
    return new AIMessage({ content: content || '' });
  }

  async *invokeStream(
    messages: BaseMessage[],
    options?: LLMCallOptions,
  ): AsyncGenerator<LLMStreamChunk> {
    const timeoutMs = options?.signal
      ? undefined
      : (LLM_TIMEOUT_MS[this.cfg.provider] ?? 60_000);
    const streamOpts = timeoutMs
      ? { ...options, signal: AbortSignal.timeout(timeoutMs) }
      : options;
    const response = await this.requestStreamResponse(messages, {
      ...streamOpts,
      stream: true,
    });
    if (!response.body) throw new Error('stream response body is empty');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffered = '';
    let minimaxJsonChunks = 0;
    let minimaxParseErrors = 0;
    let minimaxYielded = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });
      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop() || '';
      for (const line of lines) {
        const parsed = parseSseDataLine(line);
        if (parsed.kind === 'ignore') continue;
        if (parsed.kind === 'parse_error') {
          if (this.cfg.provider === 'minimax' && isAiChatDebug()) {
            minimaxParseErrors += 1;
            minimaxDebug(
              `sse_json_parse_fail lineLen=${line.length} preview=${JSON.stringify(parsed.preview)}`,
              true,
            );
          }
          continue;
        }
        const openStreamErr = getOpenAiStyleApiError(parsed.value);
        if (openStreamErr) {
          throw new Error(
            `LLM API error(${this.cfg.provider}): ${openStreamErr}`,
          );
        }
        if (this.cfg.provider === 'minimax') {
          const miniErr = getMiniMaxApiErrorMessage(parsed.value);
          if (miniErr) throw new Error(`LLM API error(minimax): ${miniErr}`);
          minimaxJsonChunks += 1;
          logMiniMaxStreamChunk(parsed.value, minimaxJsonChunks);
        }
        const chunk = extractUniversalStreamChunk(
          parsed.value,
          this.cfg.provider,
          this.cfg.thinkingEnabled,
        );
        if (chunk.answerDelta || chunk.reasoningDelta) {
          if (this.cfg.provider === 'minimax') minimaxYielded += 1;
          yield chunk;
        }
      }
    }
    if (this.cfg.provider === 'minimax' && isAiChatDebug()) {
      minimaxDebug(
        `stream_close jsonChunks=${minimaxJsonChunks} parseErrors=${minimaxParseErrors} yieldedStringChunks=${minimaxYielded}`,
        true,
      );
    }
  }

  private async requestJson(
    messages: BaseMessage[],
    options: LLMCallOptions & { stream: boolean },
  ): Promise<Record<string, unknown>> {
    const temperature = clampTemperature(
      options.temperature ?? this.cfg.temperature,
    );
    const maxTokens = options.maxTokens ?? this.cfg.maxTokens;
    const chatMessages = messages.map(toChatMessage);
    const { url, headers, body } = buildProviderRequest(this.cfg, {
      messages: chatMessages,
      temperature,
      maxTokens,
      stream: options.stream,
      signal: options.signal,
      tools: options.tools,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        formatLlmHttpError(this.cfg.provider, response.status, errorText),
      );
    }
    const payload = (await response.json()) as Record<string, unknown>;
    const openErr = getOpenAiStyleApiError(payload);
    if (openErr) {
      throw new Error(`LLM API error(${this.cfg.provider}): ${openErr}`);
    }
    if (this.cfg.provider === 'minimax') {
      const miniErr = getMiniMaxApiErrorMessage(payload);
      if (miniErr) throw new Error(`LLM API error(minimax): ${miniErr}`);
    }
    return payload;
  }

  private async requestStreamResponse(
    messages: BaseMessage[],
    options: LLMCallOptions & { stream: boolean },
  ): Promise<Response> {
    const temperature = clampTemperature(
      options.temperature ?? this.cfg.temperature,
    );
    const maxTokens = options.maxTokens ?? this.cfg.maxTokens;
    const chatMessages = messages.map(toChatMessage);
    const { url, headers, body } = buildProviderRequest(this.cfg, {
      messages: chatMessages,
      temperature,
      maxTokens,
      stream: options.stream,
      signal: options.signal,
      tools: options.tools,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        formatLlmHttpError(this.cfg.provider, response.status, errorText),
      );
    }
    return response;
  }
}

// 兼容历史调用与测试 mock
export class SimpleMiniMaxLLM extends UniversalChatLLM {
  constructor(fields?: MiniMaxInput) {
    super({
      provider: 'minimax',
      model:
        fields?.modelName ?? process.env.OPENAI_API_MODEL ?? 'MiniMax-M2.7',
      apiKey: fields?.apiKey ?? process.env.MINIMAX_API_KEY ?? '',
      temperature: fields?.temperature ?? 7,
      maxTokens: fields?.maxTokens ?? 4096,
    });
  }
}

interface BuildRequestOptions {
  messages: ChatMessagePayload[];
  temperature: number;
  maxTokens: number;
  stream: boolean;
  signal?: AbortSignal;
  tools?: ToolDefinition[];
}

/** MiniMax：国际默认 api.minimax.io；国内控制台密钥需配 MINIMAX_API_BASE=https://api.minimaxi.com */
function getMiniMaxApiBaseUrl(): string {
  const raw = process.env.MINIMAX_API_BASE?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'https://api.minimax.io';
}

function formatLlmHttpError(
  provider: LLMProvider,
  status: number,
  bodyText: string,
): string {
  let msg = `${status} - ${bodyText}`;
  if (
    provider === 'minimax' &&
    /2049|invalid api key|authorized_error/i.test(bodyText)
  ) {
    msg +=
      ' | 若密钥来自国内开放平台 (platform.minimaxi.com)，请在服务端环境变量设置 MINIMAX_API_BASE=https://api.minimaxi.com';
  }
  return `LLM API error(${provider}): ${msg}`;
}

function buildProviderRequest(
  cfg: Required<Omit<ChatModelConfig, 'apiKey'>> & { apiKey: string },
  opts: BuildRequestOptions,
): {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
} {
  if (cfg.provider === 'minimax') {
    const hasImages = opts.messages.some((msg) =>
      Array.isArray(msg.content)
        ? msg.content.some((part) => part.type === 'image_url')
        : false,
    );
    const body: MiniMaxRequestBody = hasImages
      ? {
          model: 'MiniMax-Text-01',
          messages: opts.messages,
          temperature: opts.temperature / 10,
          max_completion_tokens: opts.maxTokens,
          stream: opts.stream,
        }
      : {
          model: cfg.model,
          messages: opts.messages,
          temperature: opts.temperature / 10,
          max_tokens: opts.maxTokens,
          stream: opts.stream,
        };
    if (!hasImages && cfg.thinkingEnabled) {
      body.reasoning = { effort: 'medium', budget: cfg.thinkingBudget || 0 };
    }
    return {
      url: hasImages
        ? `${getMiniMaxApiBaseUrl()}/v1/text/chatcompletion_v2`
        : `${getMiniMaxApiBaseUrl()}/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: body as unknown as Record<string, unknown>,
    };
  }

  if (cfg.provider === 'anthropic') {
    const systemPrompt = opts.messages
      .filter((item) => item.role === 'system')
      .map((item) =>
        typeof item.content === 'string'
          ? item.content
          : joinTextFromMultimodal(item.content),
      )
      .join('\n');
    const userMessages = opts.messages.filter((item) => item.role !== 'system');
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: cfg.model,
        system: systemPrompt || undefined,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature / 10,
        stream: opts.stream,
        messages: userMessages.map((item) => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: toAnthropicMessageContent(item),
        })),
      },
    };
  }

  if (cfg.provider === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:${opts.stream ? 'streamGenerateContent' : 'generateContent'}?key=${encodeURIComponent(cfg.apiKey)}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        generationConfig: {
          temperature: opts.temperature / 10,
          maxOutputTokens: opts.maxTokens,
        },
        contents: opts.messages
          .filter((item) => item.role !== 'system')
          .map((item) => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: toGeminiParts(item.content),
          })),
      },
    };
  }

  const baseUrl =
    cfg.provider === 'deepseek'
      ? 'https://api.deepseek.com/chat/completions'
      : cfg.provider === 'qwen'
        ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

  // DeepSeek API 不支持图片内容，过滤掉 image_url 部分
  let messages = opts.messages;
  if (cfg.provider === 'deepseek') {
    messages = messages.map((msg) => {
      if (Array.isArray(msg.content)) {
        const textOnly = msg.content.filter((p) => p.type === 'text');
        return { ...msg, content: textOnly.length > 0 ? textOnly : '' };
      }
      return msg;
    });
  }

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: opts.temperature / 10,
    max_tokens: opts.maxTokens,
    thinking: {
      type: cfg.thinkingEnabled ? 'enabled' : 'disabled',
    },
    stream: opts.stream,
  };
  if (cfg.thinkingEnabled) {
    body.reasoning_effort = 'medium';
  }

  // 当提供 tools 时，某些 provider 不支持 thinking + tools 同时启用
  if (opts.tools && opts.tools.length > 0) {
    // DeepSeek 开启 thinking 时，如果同时传 tools 可能出错，降级为无 thinking
    if (cfg.provider === 'deepseek' && cfg.thinkingEnabled) {
      body.thinking = { type: 'disabled' };
      delete body.reasoning_effort;
    }
    body.tools = opts.tools as unknown[];
  }
  return {
    url: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body,
  };
}

/** OpenAI 兼容层常见 `{ "error": { "message": "..." } }` */
function getOpenAiStyleApiError(data: Record<string, unknown>): string | null {
  const err = data.error;
  if (err === undefined || err === null) return null;
  if (typeof err === 'string') {
    const s = err.trim();
    return s || null;
  }
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const msg = typeof e.message === 'string' ? e.message.trim() : '';
    if (msg) return msg;
    const type = typeof e.type === 'string' ? e.type.trim() : '';
    if (type) return type;
  }
  return null;
}

function joinReasoningDetailsText(details: unknown): string {
  if (!Array.isArray(details)) return '';
  return details
    .map((item) => {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as { text?: string }).text === 'string'
      ) {
        return (item as { text: string }).text;
      }
      return '';
    })
    .join('');
}

/** MiniMax 在业务失败时仍可能 HTTP 200，错误在 base_resp（如 2049 无效密钥） */
function getMiniMaxApiErrorMessage(
  data: Record<string, unknown>,
): string | null {
  const br = data.base_resp;
  if (!br || typeof br !== 'object') return null;
  const b = br as Record<string, unknown>;
  const code = b.status_code;
  if (code === undefined || code === null) return null;
  const num = typeof code === 'number' ? code : Number(code);
  if (!Number.isFinite(num) || num === 0) return null;
  const msg = typeof b.status_msg === 'string' ? b.status_msg.trim() : '';
  return msg || `status_code=${num}`;
}

function extractUniversalText(
  data: Record<string, unknown>,
  provider: LLMProvider,
  thinkingEnabled: boolean,
): string {
  if (provider === 'gemini') {
    const candidates = data.candidates as
      | Array<Record<string, unknown>>
      | undefined;
    const first = candidates?.[0];
    const content = first?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<Record<string, unknown>> | undefined;
    const text =
      parts
        ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('') || '';
    return text;
  }
  if (provider === 'anthropic') {
    const content = data.content as Array<Record<string, unknown>> | undefined;
    const text =
      content
        ?.map((item) => (typeof item.text === 'string' ? item.text : ''))
        .join('') || '';
    return text;
  }

  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const first = choices?.[0];
  const message = first?.message as Record<string, unknown> | undefined;
  const content = message?.content;
  const contentStr = typeof content === 'string' ? content : '';

  // ⭐ 开启深度思考时，将 reasoning_content 用 <redacted_thinking> 标签包裹，
  // 让 stream-emitter.node 能正确识别并发射 thinking_delta 事件
  if (thinkingEnabled && message) {
    const reasoning = message.reasoning_content;
    if (typeof reasoning === 'string' && reasoning.trim()) {
      return `<redacted_thinking>${reasoning}</redacted_thinking>\n${contentStr}`;
    }
    // MiniMax 特有的 reasoning_details 数组
    if (provider === 'minimax') {
      const rd = joinReasoningDetailsText(message.reasoning_details);
      if (rd.trim()) {
        return `<redacted_thinking>${rd}</redacted_thinking>\n${contentStr}`;
      }
    }
  }

  if (contentStr.trim()) return contentStr;
  if (typeof first?.text === 'string') return first.text;
  if (typeof data.text === 'string') return data.text;
  if (typeof data.reply === 'string') return data.reply;
  return '';
}

function extractUniversalStreamChunk(
  data: Record<string, unknown>,
  provider: LLMProvider,
  thinkingEnabled: boolean,
): LLMStreamChunk {
  if (provider === 'anthropic') {
    const type = typeof data.type === 'string' ? data.type : '';
    if (type !== 'content_block_delta') {
      return { answerDelta: '', reasoningDelta: '' };
    }
    const delta = data.delta as Record<string, unknown> | undefined;
    return {
      answerDelta: typeof delta?.text === 'string' ? delta.text : '',
      reasoningDelta: '',
    };
  }
  if (provider === 'gemini') {
    return {
      answerDelta: extractUniversalText(data, provider, thinkingEnabled),
      reasoningDelta: '',
    };
  }

  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const first = choices?.[0];
  const delta = first?.delta as Record<string, unknown> | undefined;
  let answerDelta = '';
  let reasoningDelta = '';
  if (delta) {
    const dc = delta.content;
    if (typeof dc === 'string' && dc.length > 0) answerDelta = dc;
    // MiniMax M2.x 流式：可能仅推 reasoning_content / reasoning_details，content 长期为空
    if (provider === 'minimax' && thinkingEnabled) {
      const dr = delta.reasoning_content;
      if (typeof dr === 'string' && dr.length > 0) reasoningDelta = dr;
      const rdt = joinReasoningDetailsText(delta.reasoning_details);
      if (rdt) reasoningDelta += rdt;
    }
    if (!answerDelta && typeof dc === 'string') answerDelta = dc;
  }
  if (!answerDelta && typeof delta?.text === 'string') answerDelta = delta.text;
  const message = first?.message as Record<string, unknown> | undefined;
  if (!answerDelta && typeof message?.content === 'string') {
    answerDelta = message.content;
  }
  if (
    provider === 'minimax' &&
    thinkingEnabled &&
    typeof message?.reasoning_content === 'string' &&
    message.reasoning_content.length > 0
  ) {
    reasoningDelta += message.reasoning_content;
  }
  return { answerDelta, reasoningDelta };
}

function summarizeContentField(label: string, v: unknown): string {
  if (v === undefined) return ` ${label}=undef`;
  if (v === null) return ` ${label}=null`;
  if (typeof v === 'string') return ` ${label}=str:${v.length}`;
  if (Array.isArray(v)) return ` ${label}=arr:${v.length}`;
  return ` ${label}=t:${typeof v}`;
}

/** 仅字段名与长度，不含正文，用于对照 MiniMax/OpenAI 兼容包体 */
function summarizeMiniMaxJsonPayload(data: Record<string, unknown>): string {
  const topKeys = Object.keys(data).join(',');
  let extra = '';
  const br = data.base_resp;
  if (br && typeof br === 'object') {
    const b = br as Record<string, unknown>;
    const code = b.status_code;
    const codeStr =
      typeof code === 'number' || typeof code === 'string'
        ? String(code)
        : 'n/a';
    extra += ` base_code=${codeStr}${summarizeContentField('base_msg', b.status_msg)}`;
  }
  const err = data.error;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    extra += summarizeContentField('err.message', e.message);
  }
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const c0 = choices?.[0];
  const c0Keys = c0 ? Object.keys(c0).join(',') : 'n/a';
  const fr = c0?.finish_reason;
  const frStr =
    typeof fr === 'string'
      ? fr
      : fr === null || fr === undefined
        ? ''
        : typeof fr === 'number' || typeof fr === 'boolean'
          ? String(fr)
          : 'nonscalar';
  const delta = c0?.delta as Record<string, unknown> | undefined;
  const deltaKeys = delta ? Object.keys(delta).join(',') : '';
  let dPart = '';
  if (delta) {
    dPart += summarizeContentField('d.content', delta.content);
    dPart += summarizeContentField(
      'd.reasoning_content',
      delta.reasoning_content,
    );
    dPart += summarizeContentField(
      'd.reasoning_details',
      delta.reasoning_details,
    );
  }
  const msg = c0?.message as Record<string, unknown> | undefined;
  let mPart = '';
  if (msg) {
    mPart += summarizeContentField('m.content', msg.content);
    mPart += summarizeContentField(
      'm.reasoning_content',
      msg.reasoning_content,
    );
    mPart += summarizeContentField(
      'm.reasoning_details',
      msg.reasoning_details,
    );
  }
  return `top=[${topKeys}] choices=${choices?.length ?? 0} c0=[${c0Keys}] finish=${frStr || 'n/a'} dKeys=[${deltaKeys || 'none'}]${dPart}${mPart}${extra}`;
}

function logMiniMaxStreamChunk(
  payload: Record<string, unknown>,
  chunkIndex: number,
): void {
  if (!isAiChatDebug()) return;
  const line = `sse_chunk#${chunkIndex} ${summarizeMiniMaxJsonPayload(payload)}`;
  const toNest = chunkIndex <= 8;
  minimaxDebug(line, toNest);
}

type SseParseResult =
  | { kind: 'ignore' }
  | { kind: 'json'; value: Record<string, unknown> }
  | { kind: 'parse_error'; preview: string };

function parseSseDataLine(rawLine: string): SseParseResult {
  const trimmed = rawLine.trim();
  if (!trimmed || trimmed.startsWith(':')) return { kind: 'ignore' };
  const raw = trimmed.startsWith('data:')
    ? trimmed.replace(/^data:\s*/, '').trim()
    : trimmed;
  if (!raw || raw === '[DONE]') return { kind: 'ignore' };
  try {
    return { kind: 'json', value: JSON.parse(raw) as Record<string, unknown> };
  } catch {
    return { kind: 'parse_error', preview: raw.slice(0, 200) };
  }
}

function parseDataUrl(
  url: string,
): { mimeType: string; base64: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

function joinTextFromMultimodal(parts: MultimodalContentPart[]): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function toAnthropicMessageContent(
  item: ChatMessagePayload,
): string | Array<Record<string, unknown>> {
  if (typeof item.content === 'string') {
    return item.content;
  }
  if (item.role === 'assistant') {
    const textOnly = joinTextFromMultimodal(item.content);
    return textOnly || '';
  }
  return item.content.map((part) => {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }
    const parsed = parseDataUrl(part.image_url.url);
    if (parsed) {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: parsed.mimeType,
          data: parsed.base64,
        },
      };
    }
    return {
      type: 'image',
      source: { type: 'url', url: part.image_url.url },
    };
  });
}

function toGeminiParts(
  content: string | MultimodalContentPart[],
): Array<Record<string, unknown>> {
  if (typeof content === 'string') {
    return [{ text: content }];
  }
  const parts: Array<Record<string, unknown>> = [];
  for (const part of content) {
    if (part.type === 'text') {
      parts.push({ text: part.text });
      continue;
    }
    const parsed = parseDataUrl(part.image_url.url);
    if (parsed) {
      parts.push({
        inline_data: {
          mime_type: parsed.mimeType,
          data: parsed.base64,
        },
      });
    }
  }
  return parts.length > 0 ? parts : [{ text: '' }];
}

function humanMessageToPayload(msg: BaseMessage): ChatMessagePayload {
  const c = msg.content;
  if (typeof c === 'string') {
    return { role: 'user', content: c };
  }
  if (Array.isArray(c)) {
    const parts: MultimodalContentPart[] = [];
    for (const block of c) {
      if (typeof block === 'string') {
        parts.push({ type: 'text', text: block });
        continue;
      }
      if (block && typeof block === 'object' && 'type' in block) {
        const b = block as Record<string, unknown>;
        if (b.type === 'text' && typeof b.text === 'string') {
          parts.push({ type: 'text', text: b.text });
        } else if (
          b.type === 'image_url' &&
          b.image_url &&
          typeof b.image_url === 'object'
        ) {
          const url = (b.image_url as { url?: string }).url;
          if (typeof url === 'string') {
            parts.push({ type: 'image_url', image_url: { url } });
          }
        }
      }
    }
    return {
      role: 'user',
      content: parts.length > 0 ? parts : '',
    };
  }
  return { role: 'user', content: JSON.stringify(c) };
}

function baseMessageTextFallback(msg: BaseMessage): string {
  const c = msg.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c
      .map((block) => {
        if (typeof block === 'string') return block;
        if (
          block &&
          typeof block === 'object' &&
          'text' in block &&
          typeof (block as { text?: string }).text === 'string'
        ) {
          return (block as { text: string }).text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

function toChatMessage(msg: BaseMessage): ChatMessagePayload {
  if (msg instanceof SystemMessage) {
    return { role: 'system', content: baseMessageTextFallback(msg) };
  }
  if (msg instanceof AIMessage) {
    const payload: ChatMessagePayload = {
      role: 'assistant',
      content: baseMessageTextFallback(msg) || null,
    };
    // ⭐ 携带原生 tool_calls 供 API 识别
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      payload.tool_calls = msg.tool_calls.map((tc) => ({
        id:
          tc.id ||
          `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'function' as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.args),
        },
      }));
    }
    return payload;
  }
  if (msg instanceof HumanMessage) {
    return humanMessageToPayload(msg);
  }
  // ⭐ ToolMessage → tool role
  if (msg instanceof ToolMessage) {
    return {
      role: 'tool',
      content: baseMessageTextFallback(msg),
      tool_call_id: msg.tool_call_id,
    };
  }
  return { role: 'user', content: baseMessageTextFallback(msg) };
}

function clampTemperature(value: number): number {
  if (Number.isNaN(value)) return 7;
  return Math.min(10, Math.max(0, value));
}

// ──────────────────────────────────────────
// 原生工具调用支持
// ──────────────────────────────────────────

/**
 * 从 OpenAI 兼容的 API 响应中提取 tool_calls
 */
function extractToolCalls(
  data: Record<string, unknown>,
): AIMessage['tool_calls'] | null {
  const choices = data.choices as Array<Record<string, unknown>> | undefined;
  const first = choices?.[0];
  const message = first?.message as Record<string, unknown> | undefined;
  const rawCalls = message?.tool_calls as
    | Array<Record<string, unknown>>
    | undefined;
  if (!rawCalls || rawCalls.length === 0) return null;

  return rawCalls.map((tc) => {
    const fn = tc.function as Record<string, unknown> | undefined;
    const argsStr = (fn?.arguments as string) || '{}';
    return {
      name: (fn?.name as string) || '',
      args: (() => {
        try {
          return JSON.parse(argsStr) as Record<string, unknown>;
        } catch {
          return {};
        }
      })(),
      id:
        (tc.id as string) ||
        `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'tool_call' as const,
    };
  });
}

/**
 * 将 Zod schema 转成 JSON Schema（OpenAI tools 参数格式）
 *
 * 访问 Zod 内部属性（_def、typeName、innerType、unwrap 等）是必要的，
 * 因为相应类型未在 Zod 的公共类型中暴露。
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def = (schema as { _def?: Record<string, unknown> })._def;
  const typeName = def?.typeName as string | undefined;

  if (typeName === 'ZodObject') {
    const rawShape = def?.shape;
    const shape = typeof rawShape === 'function' ? rawShape() : rawShape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    if (shape && typeof shape === 'object') {
      for (const [key, field] of Object.entries(
        shape as Record<string, z.ZodTypeAny>,
      )) {
        const fieldDef = (field as any)._def;
        const fieldType = fieldDef?.typeName as string | undefined;
        if (fieldType === 'ZodOptional' || fieldType === 'ZodDefault') {
          const inner =
            (field as any)._def?.innerType ?? (field as any).unwrap?.();
          properties[key] = inner ? zodToJsonSchema(inner) : { type: 'string' };
        } else {
          properties[key] = zodToJsonSchema(field);
          required.push(key);
        }
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  if (typeName === 'ZodString') {
    return { type: 'string' };
  }
  if (typeName === 'ZodNumber') {
    return { type: 'number' };
  }
  if (typeName === 'ZodBoolean') {
    return { type: 'boolean' };
  }
  if (typeName === 'ZodEnum') {
    return { type: 'string', enum: (def?.values as unknown[]) || [] };
  }
  if (typeName === 'ZodOptional' || typeName === 'ZodDefault') {
    const inner = (schema as any)._def?.innerType ?? (schema as any).unwrap?.();
    return inner ? zodToJsonSchema(inner) : { type: 'string' };
  }
  if (typeName === 'ZodNullable') {
    const nullableInner =
      (schema as any)._def?.innerType ?? (schema as any).unwrap?.();
    return nullableInner
      ? { ...zodToJsonSchema(nullableInner), nullable: true }
      : { type: 'string', nullable: true };
  }
  if (typeName === 'ZodArray') {
    const elementSchema = (schema as any)._def?.type ?? (schema as any).element;
    return {
      type: 'array',
      items: elementSchema
        ? zodToJsonSchema(elementSchema)
        : { type: 'string' },
    };
  }
  if (typeName === 'ZodUnion' || typeName === 'ZodDiscriminatedUnion') {
    const options = (def?.options as z.ZodTypeAny[]) || [];
    return { anyOf: options.map((o) => zodToJsonSchema(o)) };
  }

  return { type: 'string' }; // fallback
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */

/**
 * 将 Zod schema 转成 JSON Schema，并合并 describe() 描述
 * 导出供 agent.node.ts 使用
 */
export function zodSchemaToJsonSchema(
  schema: z.ZodTypeAny,
): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema);
  return mergeDescribeToJsonSchema(schema, jsonSchema);
}

/** 将 describe() 元数据合并到 JSON Schema */
function mergeDescribeToJsonSchema(
  schema: z.ZodTypeAny,
  jsonSchema: Record<string, unknown>,
): Record<string, unknown> {
  const def = schema._def as Record<string, unknown> | undefined;
  if (def?.description && typeof def.description === 'string') {
    return { ...jsonSchema, description: def.description };
  }
  return jsonSchema;
}
