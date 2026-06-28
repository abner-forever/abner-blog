/**
 * Anthropic Claude LLM Provider
 *
 * Uses Anthropic Messages API with tool use / structured output.
 */
import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
} from './llm-provider.interface';

export class ClaudeProvider implements LLMProvider {
  readonly name = 'anthropic';

  private createClient(config: LLMProviderConfig): Anthropic {
    return new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
  }

  private getModel(config: LLMProviderConfig): string {
    return config.model || 'claude-sonnet-4-20250514';
  }

  private convertMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));
  }

  async complete(
    messages: LLMMessage[],
    config: LLMProviderConfig,
  ): Promise<string> {
    const client = this.createClient(config);
    const response = await client.messages.create({
      model: this.getModel(config),
      max_tokens: 8192,
      messages: this.convertMessages(messages),
      system: messages.find((m) => m.role === 'system')?.content,
    });

    return response.content
      .filter((block: { type: string; text?: string }) => block.type === 'text')
      .map((block: { type: string; text?: string }) => block.text || '')
      .join('');
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (text: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const client = this.createClient(config);
    try {
      const stream = await client.messages.create({
        model: this.getModel(config),
        max_tokens: 8192,
        messages: this.convertMessages(messages),
        system: messages.find((m) => m.role === 'system')?.content,
        stream: true,
      });

      let fullText = '';
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text || '';
          fullText += text;
          onChunk(text);
        }
      }
      onDone(fullText);
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
