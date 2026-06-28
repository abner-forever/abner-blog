/**
 * LLM Provider interface for page generation
 *
 * All providers (DeepSeek, OpenAI, Anthropic) implement this interface.
 * The factory selects the correct provider based on user config.
 */

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStreamEvent {
  type: 'chunk' | 'done' | 'error';
  data: string;
}

export interface LLMProvider {
  /** Provider name identifier */
  readonly name: string;

  /**
   * Send a completion request and get full response.
   * Used for non-streaming calls (e.g., initial schema planning).
   */
  complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<string>;

  /**
   * Send a completion request and stream the response.
   * Used for streaming page region generation.
   */
  stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (text: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: Error) => void,
  ): Promise<void>;
}
