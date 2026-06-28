/**
 * DeepSeek LLM Provider
 *
 * Uses OpenAI-compatible Chat Completions API since DeepSeek is API-compatible
 * with OpenAI. Base URL defaults to https://api.deepseek.com/v1.
 */
import OpenAI from 'openai';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
} from './llm-provider.interface';

export class DeepSeekProvider implements LLMProvider {
  readonly name = 'deepseek';

  private createClient(config: LLMProviderConfig): OpenAI {
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
    });
  }

  private getModel(config: LLMProviderConfig): string {
    return config.model || 'deepseek-chat';
  }

  async complete(
    messages: LLMMessage[],
    config: LLMProviderConfig,
  ): Promise<string> {
    const client = this.createClient(config);
    const response = await client.chat.completions.create({
      model: this.getModel(config),
      messages,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content || '';
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
      const stream = await client.chat.completions.create({
        model: this.getModel(config),
        messages,
        temperature: 0.7,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      }
      onDone(fullText);
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
