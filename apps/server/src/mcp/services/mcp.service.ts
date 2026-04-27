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
  GetUserInfoSchema,
} from '../schemas';
import { WeatherTools } from '../tools/weather.tools';
import { CalendarTools } from '../tools/calendar.tools';
import { TodoTools } from '../tools/todo.tools';
import { UserTools } from '../tools/user.tools';
import type { McpToolResult, ToolCallParams, ToolDefinition } from '../types';
import { MCP_TOOL_METADATA } from '../utils/mcp-tool-metadata';
import type { ZodType } from 'zod';
import { UsersService } from '../../users/users.service';
import { McpRequestContextService } from './mcp-request-context.service';

@Injectable()
export class McpService implements OnModuleInit {
  private readonly logger = new Logger(McpService.name);
  private server: McpServer;
  private readonly registeredTools: ToolDefinition[] = [];
  private readonly toolExecutors = new Map<
    string,
    (params: ToolCallParams) => Promise<McpToolResult>
  >();

  constructor(
    private readonly weatherTools: WeatherTools,
    private readonly calendarTools: CalendarTools,
    private readonly todoTools: TodoTools,
    private readonly userTools: UserTools,
    private readonly usersService: UsersService,
    private readonly requestContext: McpRequestContextService,
  ) {}

  onModuleInit() {
    this.initializeServer();
  }

  private initializeServer() {
    this.server = new McpServer({
      name: 'abner-blog-mcp-server',
      version: '1.0.0',
    });

    this.registerWeatherTools();
    this.registerCalendarTools();
    this.registerTodoTools();
    this.registerUserTools();

    this.logger.log(
      `MCP Server initialized with ${this.registeredTools.length} tools registered`,
    );
  }

  private registerTool(
    name: string,
    title: string,
    description: string,
    inputSchema: ToolDefinition['inputSchema'],
    handler: (params: ToolCallParams) => Promise<McpToolResult>,
  ) {
    const toolDef: ToolDefinition = {
      name,
      title,
      description,
      inputSchema,
    };
    this.registeredTools.push(toolDef);
    this.toolExecutors.set(name, handler);

    this.server.registerTool(
      name,
      { title, description, inputSchema },
      handler,
    );
  }

  private registerWeatherTools() {
    this.registerParsedTool('get_weather', GetWeatherSchema, (params) =>
      this.weatherTools.getWeather(params),
    );

    this.registerParsedTool('get_air_quality', GetAirQualitySchema, (params) =>
      this.weatherTools.getAirQuality(params),
    );
  }

  private registerCalendarTools() {
    this.registerParsedTool('list_events', ListEventsSchema, (params) =>
      this.calendarTools.listEvents(params),
    );

    this.registerParsedTool('create_event', CreateEventSchema, (params) =>
      this.calendarTools.createEvent(params),
    );

    this.registerParsedTool('update_event', UpdateEventSchema, (params) =>
      this.calendarTools.updateEvent(params),
    );

    this.registerParsedTool('delete_event', DeleteEventSchema, (params) =>
      this.calendarTools.deleteEvent(params),
    );
  }

  private registerTodoTools() {
    this.registerParsedTool('list_todos', ListTodosSchema, (params) =>
      this.todoTools.listTodos(params),
    );

    this.registerParsedTool('create_todo', CreateTodoSchema, (params) =>
      this.todoTools.createTodo(params),
    );

    this.registerParsedTool('update_todo', UpdateTodoSchema, (params) =>
      this.todoTools.updateTodo(params),
    );

    this.registerParsedTool('delete_todo', DeleteTodoSchema, (params) =>
      this.todoTools.deleteTodo(params),
    );
  }

  private registerUserTools() {
    this.registerParsedTool('get_user_info', GetUserInfoSchema, (params) =>
      this.userTools.getUserInfo(params),
    );
  }

  getServer(): McpServer {
    return this.server;
  }

  listTools(): ToolDefinition[] {
    return this.registeredTools;
  }

  async callTool(name: string, params: ToolCallParams): Promise<McpToolResult> {
    this.logger.debug(`callTool(${name}) params: ${JSON.stringify(params)}`);
    const executor = this.toolExecutors.get(name);
    if (!executor) {
      throw new Error(`Unsupported MCP tool: ${name}`);
    }
    return executor(params);
  }

  private toMcpResult(result: {
    content: McpToolResult['content'];
    structuredContent?: unknown;
  }): McpToolResult {
    const normalized = this.toStructuredContent(result.structuredContent);
    return normalized
      ? { content: result.content, structuredContent: normalized }
      : { content: result.content };
  }

  private toStructuredContent(
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }

  private registerParsedTool<TParsed>(
    name: keyof typeof MCP_TOOL_METADATA,
    schema: ZodType<TParsed>,
    executor: (params: TParsed) => Promise<{
      content: McpToolResult['content'];
      structuredContent?: unknown;
    }>,
  ): void {
    const { title, description } = MCP_TOOL_METADATA[name];
    this.registerTool(name, title, description, schema, async (params) => {
      const parsed = schema.parse(params);
      this.logger.debug(
        `Calling ${name} with params: ${JSON.stringify(parsed)}`,
      );
      const result = await executor(parsed);
      return this.toMcpResult(result);
    });
  }
}
