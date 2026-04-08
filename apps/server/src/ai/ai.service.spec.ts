// Mock environment before imports
process.env.OPENAI_API_KEY = 'test-api-key';

import { Test, TestingModule } from '@nestjs/testing';
import { AICommandService } from './services/ai-command.service';
import { AIService } from './ai.service';
import { CalendarService } from '../calendar/calendar.service';
import { TodosService } from '../todos/todos.service';
import { WeatherService, type WeatherData } from '../weather/weather.service';
import { AIConfigService } from './services/ai-config.service';
import { AIChatSessionService } from './services/ai-chat-session.service';
import { AIWeatherService } from './services/ai-weather.service';
import { AIChatResponseService } from './services/ai-chat-response.service';
import { AIWebSearchService } from './services/ai-web-search.service';
import {
  CalendarEvent,
  CalendarEventType,
} from '../entities/calendar-event.entity';
import { Todo } from '../entities/todo.entity';

// Mock the LLM
const mockInvoke = jest.fn();
const mockInvokeStream = jest.fn();
jest.mock('./langchain/model', () => ({
  UniversalChatLLM: jest.fn().mockImplementation(() => ({
    invoke: mockInvoke,
    invokeStream: mockInvokeStream,
  })),
  SimpleMiniMaxLLM: jest.fn().mockImplementation(() => ({
    invoke: mockInvoke,
    invokeStream: mockInvokeStream,
  })),
}));

/** 固定「当前时间」，避免天气用例依赖运行日期的日历偏移 */
const WEATHER_CURRENT_DATE = '2026-04-01T12:00:00.000Z';

describe('AIService Integration', () => {
  let service: AIService;
  let calendarService: jest.Mocked<CalendarService>;
  let todosService: jest.Mocked<TodosService>;
  let weatherService: jest.Mocked<WeatherService>;
  let todosCreateMock: jest.Mock;
  let getWeatherMock: jest.Mock;

  beforeEach(async () => {
    mockInvoke.mockReset();
    mockInvokeStream.mockReset();

    const mockCalendarService = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const mockTodosService = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const mockWeatherService = {
      getWeather: jest.fn(),
    };

    todosCreateMock = mockTodosService.create;
    getWeatherMock = mockWeatherService.getWeather;
    const mockAIConfigService = {
      resolveModelConfig: jest.fn().mockResolvedValue({
        provider: 'minimax',
        model: 'MiniMax-M2.5',
        apiKey: 'test-key',
        temperature: 7,
        maxTokens: 4096,
      }),
      getUserConfig: jest.fn(),
      saveUserConfig: jest.fn(),
    };

    const mockWebSearchService = {
      preparePrompt: jest.fn().mockResolvedValue({
        ok: false,
        message: '未配置搜索密钥（测试占位）',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        AICommandService,
        AIChatSessionService,
        AIWeatherService,
        AIChatResponseService,
        { provide: AIWebSearchService, useValue: mockWebSearchService },
        { provide: CalendarService, useValue: mockCalendarService },
        { provide: TodosService, useValue: mockTodosService },
        { provide: WeatherService, useValue: mockWeatherService },
        { provide: AIConfigService, useValue: mockAIConfigService },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    calendarService = module.get(CalendarService);
    todosService = module.get(TodosService);
    weatherService = module.get(WeatherService);
  });

  function buildCalendarEvent(
    partial: Pick<CalendarEvent, 'id' | 'title' | 'startDate' | 'endDate'>,
  ): CalendarEvent {
    const e = new CalendarEvent();
    e.id = partial.id;
    e.title = partial.title;
    e.startDate = partial.startDate;
    e.endDate = partial.endDate;
    e.description = '';
    e.type = CalendarEventType.EVENT;
    e.allDay = false;
    e.location = '';
    e.color = '';
    e.isPublic = true;
    e.completed = false;
    e.createdAt = new Date();
    e.updatedAt = new Date();
    return e;
  }

  function buildTodoCreated(
    partial: Pick<
      Todo,
      'id' | 'title' | 'description' | 'completed' | 'createdAt'
    >,
  ): Omit<Todo, 'user'> {
    return {
      id: partial.id,
      title: partial.title,
      description: partial.description ?? '',
      completed: partial.completed,
      createdAt: partial.createdAt,
      updatedAt: partial.createdAt,
    };
  }

  describe('processMessage', () => {
    it('should detect create_event intent and create event', async () => {
      // Mock LLM responses: intent -> event extraction
      mockInvoke
        .mockResolvedValueOnce({ content: 'create_event' }) // intent detection
        .mockResolvedValueOnce({
          content: JSON.stringify({
            title: '复习面试',
            startDate: '2026-03-27T01:00:00.000Z',
            endDate: '2026-03-27T02:00:00.000Z',
          }),
        }); // event extraction

      calendarService.create.mockResolvedValue(
        buildCalendarEvent({
          id: 1,
          title: '复习面试',
          startDate: new Date('2026-03-27T01:00:00.000Z'),
          endDate: new Date('2026-03-27T02:00:00.000Z'),
        }),
      );

      const result = await service.processMessage(
        '明上午9到10点复习面试',
        1,
        '2026-03-26T00:00:00.000Z',
      );

      expect(result.type).toBe('event_created');
      expect(result.data).toHaveProperty('title', '复习面试');
    });

    it('should detect create_todo intent and create todo', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: 'create_todo' })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            title: '买牛奶',
            description: null,
          }),
        });

      todosService.create.mockResolvedValue(
        buildTodoCreated({
          id: 1,
          title: '买牛奶',
          description: '',
          completed: false,
          createdAt: new Date(),
        }),
      );

      const result = await service.processMessage('提醒我买牛奶', 1);

      expect(result.type).toBe('todo_created');
      expect(result.data).toHaveProperty('title', '买牛奶');
    });

    it('should detect query_schedule intent', async () => {
      mockInvoke.mockResolvedValueOnce({ content: 'query_schedule' });

      calendarService.findAll.mockResolvedValue([]);
      todosService.findAll.mockResolvedValue({
        todos: [],
        stats: { total: 0, completed: 0, pending: 0 },
      });

      const result = await service.processMessage('查看我的日程', 1);

      expect(result.type).toBe('schedule_query');
    });

    it('should handle chat intent when message is unclear', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: 'chat' })
        .mockResolvedValueOnce({ content: '你好！有什么我可以帮你的？' });

      const result = await service.processMessage('你好', 1);

      expect(result.type).toBe('chat');
    });

    it('should query weather with beijing fallback when city is missing', async () => {
      mockInvoke.mockResolvedValueOnce({ content: 'NONE' });
      const beijingWeather: WeatherData = {
        city: '北京',
        latitude: 39.9042,
        longitude: 116.4074,
        temperature: 18,
        temperatureMax: 22,
        temperatureMin: 12,
        weatherCode: 0,
        weatherText: '晴',
        weatherEmoji: '☀️',
        isDay: true,
        windspeed: 8,
      };
      weatherService.getWeather.mockResolvedValue(beijingWeather);

      const result = await service.processMessage(
        '今天天气怎么样',
        1,
        WEATHER_CURRENT_DATE,
      );

      expect(getWeatherMock).toHaveBeenCalledWith(
        'unknown',
        '北京',
        '2026-04-01',
      );
      expect(result.type).toBe('chat');
      expect(result.content).toContain('当前温度18');
    });

    it('should query shanghai weather when message contains specific city', async () => {
      mockInvoke.mockResolvedValueOnce({ content: '上海' });
      const shanghaiWeather: WeatherData = {
        city: '上海',
        latitude: 31.2304,
        longitude: 121.4737,
        temperature: 21,
        temperatureMax: 25,
        temperatureMin: 16,
        weatherCode: 0,
        weatherText: '晴',
        weatherEmoji: '☀️',
        isDay: true,
        windspeed: 10,
      };
      weatherService.getWeather.mockResolvedValue(shanghaiWeather);

      const result = await service.processMessage(
        '明天上海天气',
        1,
        WEATHER_CURRENT_DATE,
      );

      expect(getWeatherMock).toHaveBeenCalledWith(
        'unknown',
        '上海',
        '2026-04-02',
      );
      expect(result.type).toBe('chat');
      expect(result.content).toContain('当前温度21');
    });

    it('should query county weather when location has no suffix', async () => {
      mockInvoke.mockResolvedValueOnce({ content: 'NONE' });
      const jiangeWeather: WeatherData = {
        city: '剑阁',
        latitude: 32.28,
        longitude: 105.53,
        temperature: 17,
        temperatureMax: 21,
        temperatureMin: 11,
        weatherCode: 0,
        weatherText: '晴',
        weatherEmoji: '☀️',
        isDay: true,
        windspeed: 6,
      };
      weatherService.getWeather.mockResolvedValue(jiangeWeather);

      const result = await service.processMessage(
        '剑阁天气怎么样',
        1,
        WEATHER_CURRENT_DATE,
      );

      expect(getWeatherMock).toHaveBeenCalledWith(
        'unknown',
        '剑阁',
        '2026-04-01',
      );
      expect(result.type).toBe('chat');
      expect(result.content).toContain('当前温度17');
    });

    it('should use helpful chat fallback instead of apology', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: 'chat' })
        .mockResolvedValueOnce({ content: '' });

      const result = await service.processMessage('React 是啥', 1);

      expect(result.type).toBe('chat');
      expect(result.content).toContain('React');
      expect(result.content).not.toContain('抱歉，我没有理解你的意思');
    });

    it('should return clarification when event extraction fails', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: 'create_event' })
        .mockResolvedValueOnce({ content: 'invalid json' });

      const result = await service.processMessage(
        '明上午开会',
        1,
        '2026-03-26T00:00:00.000Z',
      );

      expect(result.type).toBe('clarification_needed');
    });

    it('should clean title by removing time prefix', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: 'create_todo' })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            title: '9-买牛奶',
            description: null,
          }),
        });

      todosService.create.mockResolvedValue(
        buildTodoCreated({
          id: 1,
          title: '买牛奶',
          description: '',
          completed: false,
          createdAt: new Date(),
        }),
      );

      const result = await service.processMessage('提醒我9-买牛奶', 1);

      expect(result.type).toBe('todo_created');
      expect(todosCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: '买牛奶' }),
        1,
      );
    });
  });

  describe('processMessageStream', () => {
    it('should return weather chat_delta for weather query', async () => {
      mockInvoke.mockResolvedValueOnce({ content: 'NONE' });
      const streamBeijingWeather: WeatherData = {
        city: '北京',
        latitude: 39.9042,
        longitude: 116.4074,
        temperature: 18,
        temperatureMax: 22,
        temperatureMin: 12,
        weatherCode: 0,
        weatherText: '晴',
        weatherEmoji: '☀️',
        isDay: true,
        windspeed: 8,
      };
      weatherService.getWeather.mockResolvedValue(streamBeijingWeather);

      const events: Array<{
        event: string;
        payload?: Record<string, unknown>;
      }> = [];
      for await (const event of service.processMessageStream(
        '明天天气',
        1,
        WEATHER_CURRENT_DATE,
      )) {
        events.push(event);
      }

      expect(getWeatherMock).toHaveBeenCalledWith(
        'unknown',
        '北京',
        '2026-04-02',
      );
      expect(events.some((e) => e.event === 'chat_delta')).toBe(true);
      expect(events[events.length - 1]?.event).toBe('done');
    });
  });
});
