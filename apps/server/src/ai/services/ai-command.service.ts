import { Injectable } from '@nestjs/common';
import { CalendarService } from '../../calendar/calendar.service';
import { UpdateCalendarEventDto } from '../../calendar/dto/calendar-event.dto';
import { TodosService } from '../../todos/todos.service';
import {
  EVENT_LOOKUP_LOOKAHEAD_DAYS,
  EVENT_LOOKUP_LOOKBACK_DAYS,
} from '../constants';
import { ChatResponseDto, IntentType } from '../dto/extraction-result.dto';
import {
  analyzeTodoSchedule,
  extractEventEntities,
  extractTodoEntities,
} from '../langchain/chains';
import type { ChatLLM } from '../langchain/model';
import { buildIsoDateRangeAround } from '../utils/date-range';
import { buildClarificationResponse } from '../utils/response-builders';
import { MCPServersService } from '../../mcp';

@Injectable()
export class AICommandService {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly todosService: TodosService,
    private readonly mcpServersService: MCPServersService,
  ) {}

  async handleDeleteTodo(
    message: string,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const todos = (await this.todosService.findAll(userId)).todos;
    const target = this.findBestTodoMatch(message, todos);
    if (!target) {
      return buildClarificationResponse({
        intent: IntentType.DELETE_TODO,
        missingFields: ['title'],
        suggestion: '请告诉我要删除哪个待办，例如："删除待办：买牛奶"',
      });
    }
    if (useMcpTools) {
      try {
        await this.mcpServersService.callToolForUser(userId, 'delete_todo', {
          id: target.id,
        });
      } catch {
        await this.todosService.remove(target.id, userId);
      }
    } else {
      await this.todosService.remove(target.id, userId);
    }
    return {
      type: 'todo_deleted',
      data: {
        id: target.id,
        title: target.title,
      },
    };
  }

  async handleDeleteEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const { startIso, endIso } = buildIsoDateRangeAround(
      currentDate,
      EVENT_LOOKUP_LOOKBACK_DAYS,
      EVENT_LOOKUP_LOOKAHEAD_DAYS,
    );
    const events = await this.calendarService.findAll(userId, startIso, endIso);
    const extraction = await extractEventEntities(llm, message, currentDate);
    const target = this.findBestEventMatch(
      message,
      events,
      extraction?.startDate,
    );
    if (!target) {
      return buildClarificationResponse({
        intent: IntentType.DELETE_EVENT,
        missingFields: ['title'],
        suggestion: '请告诉我要取消哪个日程，例如："取消明天的跑步"',
      });
    }
    if (useMcpTools) {
      try {
        await this.mcpServersService.callToolForUser(userId, 'delete_event', {
          id: target.id,
        });
      } catch {
        await this.calendarService.remove(target.id, userId);
      }
    } else {
      await this.calendarService.remove(target.id, userId);
    }
    return {
      type: 'event_deleted',
      data: {
        id: target.id,
        title: target.title,
        startDate: target.startDate,
      },
    };
  }

  async handleUpdateTodo(
    message: string,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const todos = (await this.todosService.findAll(userId)).todos;
    const target = this.findBestTodoMatch(message, todos);
    const nextTitle = this.extractUpdatedTitle(message);

    if (!target) {
      return buildClarificationResponse({
        intent: IntentType.UPDATE_TODO,
        missingFields: ['target'],
        suggestion: '请告诉我要修改哪个待办，例如："把买牛奶改成买牛奶和鸡蛋"',
      });
    }

    if (!nextTitle) {
      return buildClarificationResponse({
        intent: IntentType.UPDATE_TODO,
        missingFields: ['title'],
        partialData: { title: target.title },
        suggestion: '请告诉我修改后的内容，例如："把买牛奶改成买牛奶和鸡蛋"',
      });
    }

    let updated: {
      id: number;
      title: string;
      description?: string;
      completed?: boolean;
    };
    if (useMcpTools) {
      try {
        const mcpResult = await this.mcpServersService.callToolForUser(
          userId,
          'update_todo',
          { id: target.id, title: nextTitle },
        );
        const sc = mcpResult.structuredContent;
        updated = {
          id: this.getNumberField(sc, 'id') ?? target.id,
          title: this.getStringField(sc, 'title') ?? nextTitle,
          description:
            this.getStringField(sc, 'description') ??
            ('description' in target && typeof target.description === 'string'
              ? target.description
              : ''),
          completed:
            this.getBooleanField(sc, 'completed') ??
            ('completed' in target && typeof target.completed === 'boolean'
              ? target.completed
              : false),
        };
      } catch {
        updated = await this.todosService.update(
          target.id,
          { title: nextTitle },
          userId,
        );
      }
    } else {
      updated = await this.todosService.update(
        target.id,
        { title: nextTitle },
        userId,
      );
    }
    return {
      type: 'todo_updated',
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        completed: updated.completed,
      },
    };
  }

  async handleUpdateEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const { startIso, endIso } = buildIsoDateRangeAround(
      currentDate,
      EVENT_LOOKUP_LOOKBACK_DAYS,
      EVENT_LOOKUP_LOOKAHEAD_DAYS,
    );
    const events = await this.calendarService.findAll(userId, startIso, endIso);
    const target = this.findBestEventMatch(message, events);
    if (!target) {
      return buildClarificationResponse({
        intent: IntentType.UPDATE_EVENT,
        missingFields: ['target'],
        suggestion: '请告诉我要修改哪个日程，例如："把明天跑步改到后天晚上"',
      });
    }

    const extraction = await extractEventEntities(llm, message, currentDate);
    const nextTitle = this.extractUpdatedTitle(message);
    const updateData: UpdateCalendarEventDto = {};

    if (extraction?.startDate) {
      updateData.startDate = extraction.startDate;
      if (extraction.endDate) updateData.endDate = extraction.endDate;
      if (typeof extraction.allDay === 'boolean') {
        updateData.allDay = extraction.allDay;
      }
    }
    if (nextTitle) updateData.title = nextTitle;
    if (extraction?.location) updateData.location = extraction.location;

    if (Object.keys(updateData).length === 0) {
      return buildClarificationResponse({
        intent: IntentType.UPDATE_EVENT,
        missingFields: ['changes'],
        partialData: { title: target.title },
        suggestion:
          '请说明要改成什么，例如："把明天跑步改到后天晚上8点"或"把跑步改成骑车"',
      });
    }

    let updated: {
      id: number;
      title: string;
      startDate?: unknown;
      endDate?: unknown;
      location?: string;
      allDay?: boolean;
    };
    if (useMcpTools) {
      try {
        const mcpResult = await this.mcpServersService.callToolForUser(
          userId,
          'update_event',
          { id: target.id, ...updateData },
        );
        const sc = mcpResult.structuredContent;
        updated = {
          id: this.getNumberField(sc, 'id') ?? target.id,
          title:
            this.getStringField(sc, 'title') ??
            updateData.title ??
            target.title,
          startDate: this.getUnknownField(sc, 'startDate') ?? target.startDate,
          endDate: this.getUnknownField(sc, 'endDate') ?? target.endDate,
          location:
            this.getStringField(sc, 'location') ??
            (typeof updateData.location === 'string'
              ? updateData.location
              : target.location),
          allDay:
            this.getBooleanField(sc, 'allDay') ??
            Boolean(updateData.allDay ?? target.allDay),
        };
      } catch {
        updated = await this.calendarService.update(
          target.id,
          updateData,
          userId,
        );
      }
    } else {
      updated = await this.calendarService.update(
        target.id,
        updateData,
        userId,
      );
    }
    return {
      type: 'event_updated',
      data: {
        id: updated.id,
        title: updated.title,
        startDate: updated.startDate,
        endDate: updated.endDate,
        location: updated.location,
        allDay: updated.allDay,
      },
    };
  }

  async handleCreateTodo(
    llm: ChatLLM,
    message: string,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const extraction = await extractTodoEntities(llm, message);

    if (!extraction?.title) {
      return buildClarificationResponse({
        intent: IntentType.CREATE_TODO,
        missingFields: ['title'],
        suggestion: '请提供待办事项的标题，例如："买牛奶"',
      });
    }

    let todo: {
      id: number;
      title: string;
      description?: string;
      completed?: boolean;
      createdAt?: unknown;
    };
    if (useMcpTools) {
      try {
        const mcpResult = await this.mcpServersService.callToolForUser(
          userId,
          'create_todo',
          {
            title: extraction.title,
            description: extraction.description,
          },
        );
        const sc = mcpResult.structuredContent;
        todo = {
          id: this.getNumberField(sc, 'id') ?? 0,
          title: this.getStringField(sc, 'title') ?? extraction.title,
          description:
            this.getStringField(sc, 'description') ??
            extraction.description ??
            '',
          completed: this.getBooleanField(sc, 'completed') ?? false,
          createdAt:
            this.getUnknownField(sc, 'createdAt') ?? new Date().toISOString(),
        };
      } catch {
        todo = await this.todosService.create(
          { title: extraction.title, description: extraction.description },
          userId,
        );
      }
    } else {
      todo = await this.todosService.create(
        { title: extraction.title, description: extraction.description },
        userId,
      );
    }

    return {
      type: 'todo_created',
      data: {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        createdAt: todo.createdAt,
      },
    };
  }

  async handleCreateEvent(
    llm: ChatLLM,
    message: string,
    userId: number,
    currentDate: string,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const extraction = await extractEventEntities(llm, message, currentDate);

    if (!extraction?.title || !extraction?.startDate) {
      return buildClarificationResponse({
        intent: IntentType.CREATE_EVENT,
        missingFields: ['title', 'startDate'],
        partialData: extraction || {},
        suggestion: '请提供日程的标题和具体时间，例如："明上午9点开会"',
      });
    }

    let event: {
      id: number;
      title: string;
      description?: string;
      startDate?: unknown;
      endDate?: unknown;
      location?: string;
      allDay?: boolean;
    };
    if (useMcpTools) {
      try {
        const mcpResult = await this.mcpServersService.callToolForUser(
          userId,
          'create_event',
          {
            title: extraction.title,
            description: extraction.description,
            startDate: extraction.startDate,
            endDate: extraction.endDate,
            location: extraction.location,
            allDay: extraction.allDay,
          },
        );
        const sc = mcpResult.structuredContent;
        event = {
          id: this.getNumberField(sc, 'id') ?? 0,
          title: this.getStringField(sc, 'title') ?? extraction.title,
          description:
            this.getStringField(sc, 'description') ??
            extraction.description ??
            '',
          startDate:
            this.getUnknownField(sc, 'startDate') ?? extraction.startDate,
          endDate: this.getUnknownField(sc, 'endDate') ?? extraction.endDate,
          location:
            this.getStringField(sc, 'location') ?? extraction.location ?? '',
          allDay:
            this.getBooleanField(sc, 'allDay') ?? Boolean(extraction.allDay),
        };
      } catch {
        event = await this.calendarService.create(
          {
            title: extraction.title,
            description: extraction.description,
            startDate: extraction.startDate,
            endDate: extraction.endDate,
            location: extraction.location,
            allDay: extraction.allDay,
          },
          userId,
        );
      }
    } else {
      event = await this.calendarService.create(
        {
          title: extraction.title,
          description: extraction.description,
          startDate: extraction.startDate,
          endDate: extraction.endDate,
          location: extraction.location,
          allDay: extraction.allDay,
        },
        userId,
      );
    }

    return {
      type: 'event_created',
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        allDay: event.allDay,
      },
    };
  }

  async handleQuerySchedule(
    llm: ChatLLM,
    userId: number,
    useMcpTools = false,
  ): Promise<ChatResponseDto> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const startIso = startOfWeek.toISOString();
    const endIso = endOfWeek.toISOString();
    let events = await this.calendarService.findAll(userId, startIso, endIso);
    let todos = (await this.todosService.findAll(userId)).todos;

    if (useMcpTools) {
      try {
        const eventResult = await this.mcpServersService.callToolForUser(
          userId,
          'list_events',
          {
            startDate: startIso,
            endDate: endIso,
          },
        );
        const rawEvents = eventResult.structuredContent?.events;
        if (Array.isArray(rawEvents)) {
          events = rawEvents as typeof events;
        }
      } catch {
        // keep fallback
      }
      try {
        const todoResult = await this.mcpServersService.callToolForUser(
          userId,
          'list_todos',
          {},
        );
        const rawTodos = todoResult.structuredContent?.todos;
        if (Array.isArray(rawTodos)) {
          todos = rawTodos as typeof todos;
        }
      } catch {
        // keep fallback
      }
    }

    // 调用 LLM 进行分析
    const analysis = await analyzeTodoSchedule(
      llm,
      todos.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
      })),
      now.toISOString(),
    );

    return {
      type: 'schedule_query',
      scheduleData: [
        ...events.map((e) => ({
          type: 'event' as const,
          id: e.id,
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate,
          allDay: e.allDay,
        })),
        ...todos.map((t) => ({
          type: 'todo' as const,
          id: t.id,
          title: t.title,
          completed: t.completed,
        })),
      ],
      scheduleAnalysis: analysis ?? undefined,
    };
  }

  private normalizeText(input: string): string {
    return input
      .toLowerCase()
      .replace(/[，。,.!！?？:："'`~（）()[\]\s]/g, '')
      .replace(/[儿的了]/g, '')
      .replace(
        /(取消|删除|删掉|移除|不要了|改成|改为|改到|修改|更新|把|帮我|请|一下|这个|那个|明晚|明天|今晚|后天|点钟)/g,
        '',
      );
  }

  private findBestTodoMatch<T extends { id: number; title: string }>(
    message: string,
    todos: T[],
  ): T | null {
    const normalizedMessage = this.normalizeText(message);
    const sorted = [...todos].sort(
      (a, b) =>
        new Date((b as { updatedAt?: Date }).updatedAt || 0).getTime() -
        new Date((a as { updatedAt?: Date }).updatedAt || 0).getTime(),
    );
    for (const todo of sorted) {
      const normalizedTitle = this.normalizeText(todo.title);
      if (
        normalizedTitle &&
        (normalizedMessage.includes(normalizedTitle) ||
          normalizedTitle.includes(normalizedMessage))
      ) {
        return todo;
      }
    }
    return null;
  }

  private findBestEventMatch<T extends { id: number; title: string }>(
    message: string,
    events: T[],
    extractedStartDate?: string,
  ): T | null {
    const normalizedMessage = this.normalizeText(message);
    const sortedByTime = [...events].sort(
      (a, b) =>
        new Date((b as { startDate?: Date }).startDate || 0).getTime() -
        new Date((a as { startDate?: Date }).startDate || 0).getTime(),
    );
    const sorted = extractedStartDate
      ? [...sortedByTime].sort((a, b) => {
          const targetTs = new Date(extractedStartDate).getTime();
          const aTs = new Date(
            (a as { startDate?: Date }).startDate || 0,
          ).getTime();
          const bTs = new Date(
            (b as { startDate?: Date }).startDate || 0,
          ).getTime();
          return Math.abs(aTs - targetTs) - Math.abs(bTs - targetTs);
        })
      : sortedByTime;

    for (const event of sorted) {
      const normalizedTitle = this.normalizeText(event.title);
      if (
        normalizedTitle &&
        (normalizedMessage.includes(normalizedTitle) ||
          normalizedTitle.includes(normalizedMessage))
      ) {
        return event;
      }
    }

    if (extractedStartDate) {
      const targetTs = new Date(extractedStartDate).getTime();
      const nearest = sorted[0];
      if (nearest) {
        const nearestTs = new Date(
          (nearest as { startDate?: Date }).startDate || 0,
        ).getTime();
        const twoHours = 2 * 60 * 60 * 1000;
        if (Math.abs(nearestTs - targetTs) <= twoHours) {
          return nearest;
        }
      }
    }

    return null;
  }

  private extractUpdatedTitle(message: string): string | null {
    const match = message.match(
      /(?:改成|改为|改到|修改为|更新为)\s*([^，。,.]+)/,
    );
    if (!match?.[1]) return null;
    const text = match[1].trim();
    return text || null;
  }

  private getStringField(
    data: Record<string, unknown> | undefined,
    key: string,
  ): string | null {
    const value = data?.[key];
    return typeof value === 'string' ? value : null;
  }

  private getNumberField(
    data: Record<string, unknown> | undefined,
    key: string,
  ): number | null {
    const value = data?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private getBooleanField(
    data: Record<string, unknown> | undefined,
    key: string,
  ): boolean | null {
    const value = data?.[key];
    return typeof value === 'boolean' ? value : null;
  }

  private getUnknownField(
    data: Record<string, unknown> | undefined,
    key: string,
  ): unknown {
    return data?.[key];
  }
}
