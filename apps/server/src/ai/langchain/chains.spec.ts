import { AIMessage } from '@langchain/core/messages';
import {
  cleanTitle,
  detectIntent,
  extractEventEntities,
  extractTodoEntities,
} from './chains';
import { IntentType } from '../dto/extraction-result.dto';

// Mock the LLM
jest.mock('./model', () => ({
  SimpleMiniMaxLLM: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
}));

describe('cleanTitle', () => {
  it('should remove time prefix like "9-"', () => {
    expect(cleanTitle('9-复习面试')).toBe('复习面试');
  });

  it('should remove time prefix like "9到"', () => {
    expect(cleanTitle('9到复习面试')).toBe('复习面试');
  });

  it('should remove date prefix like "明"', () => {
    expect(cleanTitle('明上午开会')).toBe('开会');
  });

  it('should remove full time expression', () => {
    expect(cleanTitle('明天上午9点复习面试')).toBe('复习面试');
  });

  it('should return original title if nothing to clean', () => {
    expect(cleanTitle('买牛奶')).toBe('买牛奶');
  });

  it('should handle empty string', () => {
    expect(cleanTitle('')).toBe('');
  });

  it('should remove trailing todo command words', async () => {
    const llm = {
      invoke: jest
        .fn()
        .mockResolvedValue(new AIMessage({ content: 'invalid' })),
    } as unknown as {
      invoke: jest.Mock;
    };
    const result = await extractTodoEntities(
      llm as never,
      '完善聊天功能 记一下',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_TODO,
      title: '完善聊天功能',
    });
  });
});

describe('IntentType enum', () => {
  it('should have correct values', () => {
    expect(IntentType.CREATE_TODO).toBe('create_todo');
    expect(IntentType.CREATE_EVENT).toBe('create_event');
    expect(IntentType.UPDATE_TODO).toBe('update_todo');
    expect(IntentType.UPDATE_EVENT).toBe('update_event');
    expect(IntentType.DELETE_TODO).toBe('delete_todo');
    expect(IntentType.DELETE_EVENT).toBe('delete_event');
    expect(IntentType.QUERY_SCHEDULE).toBe('query_schedule');
    expect(IntentType.QUERY_WEATHER).toBe('query_weather');
    expect(IntentType.WEB_SEARCH).toBe('web_search');
    expect(IntentType.CHAT).toBe('chat');
  });
});

describe('detectIntent', () => {
  const createMockLlm = (content: string) =>
    ({
      invoke: jest.fn().mockResolvedValue(new AIMessage({ content })),
    }) as unknown as {
      invoke: jest.Mock;
    };

  it('should detect create_event by time expression rules', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(llm as never, '明上午9到10点复习面试');
    expect(intent).toBe(IntentType.CREATE_EVENT);
    expect(llm.invoke).not.toHaveBeenCalled();
  });

  it('should detect delete_event for cancel sentence with time', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(llm as never, '取消明晚7点的遛弯儿');
    expect(intent).toBe(IntentType.DELETE_EVENT);
    expect(llm.invoke).not.toHaveBeenCalled();
  });

  it('should map chinese llm result to create_event', async () => {
    const llm = createMockLlm('创建日程');
    const intent = await detectIntent(llm as never, '帮我安排一下');
    expect(intent).toBe(IntentType.CREATE_EVENT);
    expect(llm.invoke).toHaveBeenCalledTimes(1);
  });

  it('should return chat for normal daily conversation', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(
      llm as never,
      '今天心情有点一般，想聊聊天',
    );
    expect(intent).toBe(IntentType.CHAT);
  });

  it('should detect compact todo query as query_schedule', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(llm as never, '我最近的待办');
    expect(intent).toBe(IntentType.QUERY_SCHEDULE);
    expect(llm.invoke).not.toHaveBeenCalled();
  });

  it('should fallback to chat when llm returns verbose sentence', async () => {
    const llm = createMockLlm(
      '请告诉我要删除哪个待办，例如："删除待办：买牛奶"',
    );
    const intent = await detectIntent(
      llm as never,
      'MiniMax-M2.7对比上一代有哪些变化',
    );
    expect(intent).toBe(IntentType.CHAT);
  });

  it('should confirm medium schedule query by llm', async () => {
    const llm = createMockLlm('query_schedule');
    const intent = await detectIntent(llm as never, '看看我这周有什么安排');
    expect(intent).toBe(IntentType.QUERY_SCHEDULE);
    expect(llm.invoke).toHaveBeenCalledTimes(1);
  });

  it('should detect news query as web_search without llm', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(llm as never, '今天有什么新闻');
    expect(intent).toBe(IntentType.WEB_SEARCH);
    expect(llm.invoke).not.toHaveBeenCalled();
  });

  it('should detect 帮我总结新闻 as web_search without fast-path chat', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(
      llm as never,
      '帮我总结一下今天的科技新闻',
    );
    expect(intent).toBe(IntentType.WEB_SEARCH);
    expect(llm.invoke).not.toHaveBeenCalled();
  });
});

describe('extractEventEntities', () => {
  const createMockLlm = (content: string) =>
    ({
      invoke: jest.fn().mockResolvedValue(new AIMessage({ content })),
    }) as unknown as {
      invoke: jest.Mock;
    };

  it('should fallback to rule extraction when llm output is invalid json', async () => {
    const llm = createMockLlm('我不太确定');
    const result = await extractEventEntities(
      llm as never,
      '明上午9点开会',
      '2026-03-26T00:00:00.000Z',
    );

    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '开会',
      startDate: '2026-03-27T01:00:00.000Z',
    });
  });

  it('should extract half-hour time and location in fallback mode', async () => {
    const llm = createMockLlm('不是json');
    const result = await extractEventEntities(
      llm as never,
      '明上午9点半开会在中关村会议室',
      '2026-03-26T00:00:00.000Z',
    );

    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '开会',
      location: '中关村会议室',
      startDate: '2026-03-27T01:30:00.000Z',
    });
  });

  it('should parse tomorrow afternoon colloquial time', async () => {
    const llm = createMockLlm('invalid');
    const result = await extractEventEntities(
      llm as never,
      '明天下午3点开会',
      '2026-03-26T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '开会',
      startDate: '2026-03-27T07:00:00.000Z',
    });
  });

  it('should parse next monday colloquial time', async () => {
    const llm = createMockLlm('invalid');
    const result = await extractEventEntities(
      llm as never,
      '下周一上午9点例会',
      '2026-03-26T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '例会',
      startDate: '2026-03-30T01:00:00.000Z',
    });
  });

  it('should parse qingming festival time', async () => {
    const llm = createMockLlm('invalid');
    const result = await extractEventEntities(
      llm as never,
      '清明节上午10点扫墓',
      '2026-03-26T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '扫墓',
      startDate: '2026-04-05T02:00:00.000Z',
    });
  });
});

describe('extractTodoEntities', () => {
  const createMockLlm = (content: string) =>
    ({
      invoke: jest.fn().mockResolvedValue(new AIMessage({ content })),
    }) as unknown as {
      invoke: jest.Mock;
    };

  it('should detect create_todo for "记一下"', async () => {
    const llm = createMockLlm('chat');
    const intent = await detectIntent(llm as never, '记一下明天带简历');
    expect(intent).toBe(IntentType.CREATE_TODO);
    expect(llm.invoke).not.toHaveBeenCalled();
  });

  it('should fallback todo extraction when llm output is invalid', async () => {
    const llm = createMockLlm('无法解析');
    const result = await extractTodoEntities(llm as never, '记一下买牛奶');
    expect(result).toMatchObject({
      intent: IntentType.CREATE_TODO,
      title: '买牛奶',
    });
  });
});
