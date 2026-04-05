import { HumanMessage } from '@langchain/core/messages';
import { UniversalChatLLM } from './model';

describe('UniversalChatLLM MiniMax routing', () => {
  const originalFetch = global.fetch;
  const getJsonBody = (init: RequestInit): Record<string, unknown> => {
    if (typeof init.body !== 'string') {
      throw new Error('Expected request body to be JSON string');
    }
    return JSON.parse(init.body) as Record<string, unknown>;
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses OpenAI-compatible endpoint for minimax text-only chat', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'ok' } }],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const llm = new UniversalChatLLM({
      provider: 'minimax',
      model: 'MiniMax-M2.7',
      apiKey: 'test-key',
      temperature: 7,
      maxTokens: 512,
      thinkingEnabled: true,
      thinkingBudget: 64,
    });

    await llm.invoke([new HumanMessage('hello minimax')]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.minimax.io/v1/chat/completions');
    const body = getJsonBody(init);
    expect(body.model).toBe('MiniMax-M2.7');
    expect(body.max_tokens).toBe(512);
    expect(body.reasoning).toEqual({ effort: 'medium', budget: 64 });
  });

  it('uses native chatcompletion_v2 for minimax multimodal chat', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'image answer' } }],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const llm = new UniversalChatLLM({
      provider: 'minimax',
      model: 'MiniMax-M2.7',
      apiKey: 'test-key',
      temperature: 7,
      maxTokens: 768,
      thinkingEnabled: true,
      thinkingBudget: 64,
    });
    await llm.invoke([
      new HumanMessage({
        content: [
          { type: 'text', text: '这张图里是什么？' },
          {
            type: 'image_url',
            image_url: { url: 'data:image/png;base64,ZmFrZQ==' },
          },
        ],
      }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.minimax.io/v1/text/chatcompletion_v2');
    const body = getJsonBody(init);
    expect(body.model).toBe('MiniMax-Text-01');
    expect(body.max_completion_tokens).toBe(768);
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('reasoning');
  });
});
