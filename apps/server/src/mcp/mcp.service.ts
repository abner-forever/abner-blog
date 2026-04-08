import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  GetWeatherSchema,
  GetAirQualitySchema,
  ListEventsSchema,
  CreateEventSchema,
  UpdateEventSchema,
  DeleteEventSchema,
  ListTodosSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  DeleteTodoSchema,
} from './schemas';
import { WeatherTools } from './tools/weather.tools';
import { CalendarTools } from './tools/calendar.tools';
import { TodoTools } from './tools/todo.tools';

interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: any;
}

interface ToolHandlerResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
}

type ToolCallParams = Record<string, unknown>;

@Injectable()
export class McpService implements OnModuleInit {
  private readonly logger = new Logger(McpService.name);
  private server: McpServer;
  private readonly registeredTools: ToolDefinition[] = [];

  constructor(
    private readonly weatherTools: WeatherTools,
    private readonly calendarTools: CalendarTools,
    private readonly todoTools: TodoTools,
  ) {}

  onModuleInit() {
    this.initializeServer();
  }

  private initializeServer() {
    this.server = new McpServer({
      name: 'abner-blog-mcp-server',
      version: '1.0.0',
    });

    // 注册天气工具
    this.registerWeatherTools();

    // 注册日程工具
    this.registerCalendarTools();

    // 注册待办工具
    this.registerTodoTools();

    this.logger.log(
      `MCP Server initialized with ${this.registeredTools.length} tools registered`,
    );
  }

  private registerTool(
    name: string,
    title: string,
    description: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputSchema: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (params: any) => Promise<ToolHandlerResult>,
  ) {
    const toolDef: ToolDefinition = {
      name,
      title,
      description,
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      inputSchema,
    };
    this.registeredTools.push(toolDef);

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    this.server.registerTool(
      name,
      { title, description, inputSchema },
      handler,
    );
  }

  private registerWeatherTools() {
    // get_weather 工具
    this.registerTool(
      'get_weather',
      '获取天气信息',
      `获取指定城市的天气信息，包括温度、天气状况、风速等。

使用场景：
- 用户询问某个城市的天气时使用
- 可以指定日期查询（默认今天）
- 会同时返回空气质量和建议

参数：
- city: 城市名称，如"北京"、"上海"、"深圳"
- date: 可选，日期格式 YYYY-MM-DD，如 "2026-04-08"`,
      GetWeatherSchema,
      async (params) => {
        this.logger.debug(
          `Calling get_weather with params: ${JSON.stringify(params)}`,
        );
        const result = await this.weatherTools.getWeather(params);
        // 确保返回类型兼容
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // get_air_quality 工具
    this.registerTool(
      'get_air_quality',
      '获取空气质量',
      `获取指定城市的空气质量信息，包括 AQI、污染物浓度、健康建议等。

使用场景：
- 用户询问空气质量时使用
- 会返回详细的污染物数据和健康建议
- 适合提醒敏感人群是否适合外出`,
      GetAirQualitySchema,
      async (params) => {
        this.logger.debug(
          `Calling get_air_quality with params: ${JSON.stringify(params)}`,
        );
        const result = await this.weatherTools.getAirQuality(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as unknown as
            | Record<string, unknown>
            | undefined,
        };
      },
    );
  }

  private registerCalendarTools() {
    // list_events 工具
    this.registerTool(
      'list_events',
      '列出日程',
      `列出指定日期范围内的所有日程。

使用场景：
- 用户查询某天/某周/某月的日程安排时使用
- 需要提供开始和结束日期
- 会返回日程的标题、时间、地点等信息

参数：
- startDate: 开始日期，格式 YYYY-MM-DD
- endDate: 结束日期，格式 YYYY-MM-DD`,
      ListEventsSchema,
      async (params) => {
        this.logger.debug(
          `Calling list_events with params: ${JSON.stringify(params)}`,
        );
        const result = await this.calendarTools.listEvents(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // create_event 工具
    this.registerTool(
      'create_event',
      '创建日程',
      `创建一个新的日程/事件。

使用场景：
- 用户要求创建日程、会议、提醒时使用
- 需要提供日程标题和开始时间
- 可选提供结束时间、地点、描述等

参数：
- title: 日程标题，如"团队周会"、"医生预约"
- startDate: 开始时间，ISO 8601 格式
- endDate: 可选，结束时间
- allDay: 可选，是否全天事件
- location: 可选，地点
- description: 可选，描述`,
      CreateEventSchema,
      async (params) => {
        this.logger.debug(
          `Calling create_event with params: ${JSON.stringify(params)}`,
        );
        const result = await this.calendarTools.createEvent(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // update_event 工具
    this.registerTool(
      'update_event',
      '更新日程',
      `更新一个已存在的日程。

使用场景：
- 用户要求修改日程的时间、地点、内容时使用
- 需要提供日程 ID 和要修改的字段

参数：
- id: 日程 ID（必填）
- title: 新标题（可选）
- startDate: 新开始时间（可选）
- endDate: 新结束时间（可选）
- location: 新地点（可选）
- completed: 是否已完成（可选）`,
      UpdateEventSchema,
      async (params) => {
        this.logger.debug(
          `Calling update_event with params: ${JSON.stringify(params)}`,
        );
        const result = await this.calendarTools.updateEvent(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // delete_event 工具
    this.registerTool(
      'delete_event',
      '删除日程',
      `删除一个已存在的日程。

使用场景：
- 用户要求取消或删除某个日程时使用
- 需要提供日程 ID

参数：
- id: 要删除的日程 ID（必填）`,
      DeleteEventSchema,
      async (params) => {
        this.logger.debug(
          `Calling delete_event with params: ${JSON.stringify(params)}`,
        );
        const result = await this.calendarTools.deleteEvent(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );
  }

  private registerTodoTools() {
    // list_todos 工具
    this.registerTool(
      'list_todos',
      '列出待办',
      `列出用户的待办事项。

使用场景：
- 用户查询自己的待办列表时使用
- 可以筛选已完成/未完成的待办
- 会返回待办的标题、描述、完成状态等

参数：
- completed: 可选，true 返回已完成的，false 返回未完成的`,
      ListTodosSchema,
      async (params) => {
        this.logger.debug(
          `Calling list_todos with params: ${JSON.stringify(params)}`,
        );
        const result = await this.todoTools.listTodos(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // create_todo 工具
    this.registerTool(
      'create_todo',
      '创建待办',
      `创建一个新的待办事项。

使用场景：
- 用户要求记录待办、提醒时使用
- 只需要提供标题
- 可选提供详细描述

参数：
- title: 待办标题，如"完成项目报告"
- description: 可选，详细描述`,
      CreateTodoSchema,
      async (params) => {
        this.logger.debug(
          `Calling create_todo with params: ${JSON.stringify(params)}`,
        );
        const result = await this.todoTools.createTodo(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // update_todo 工具
    this.registerTool(
      'update_todo',
      '更新待办',
      `更新一个已存在的待办事项。

使用场景：
- 用户要求修改待办内容或标记完成时使用
- 需要提供待办 ID 和要修改的字段

参数：
- id: 待办 ID（必填）
- title: 新标题（可选）
- description: 新描述（可选）
- completed: 是否已完成（可选）`,
      UpdateTodoSchema,
      async (params) => {
        this.logger.debug(
          `Calling update_todo with params: ${JSON.stringify(params)}`,
        );
        const result = await this.todoTools.updateTodo(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );

    // delete_todo 工具
    this.registerTool(
      'delete_todo',
      '删除待办',
      `删除一个已存在的待办事项。

使用场景：
- 用户要求删除某个待办时使用
- 需要提供待办 ID

参数：
- id: 要删除的待办 ID（必填）`,
      DeleteTodoSchema,
      async (params) => {
        this.logger.debug(
          `Calling delete_todo with params: ${JSON.stringify(params)}`,
        );
        const result = await this.todoTools.deleteTodo(params);
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      },
    );
  }

  /**
   * 获取 MCP Server 实例
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * 获取已注册的工具列表
   */
  listTools(): ToolDefinition[] {
    return this.registeredTools;
  }

  async callTool(
    name: string,
    params: ToolCallParams,
  ): Promise<ToolHandlerResult> {
    this.logger.debug(`callTool(${name}) params: ${JSON.stringify(params)}`);
    switch (name) {
      case 'get_weather': {
        const result = await this.weatherTools.getWeather(
          params as unknown as Parameters<WeatherTools['getWeather']>[0],
        );
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      }
      case 'get_air_quality': {
        const result = await this.weatherTools.getAirQuality(
          params as unknown as Parameters<WeatherTools['getAirQuality']>[0],
        );
        return {
          content: result.content,
          structuredContent: result.structuredContent as
            | Record<string, unknown>
            | undefined,
        };
      }
      default:
        throw new Error(`Unsupported MCP tool: ${name}`);
    }
  }
}
