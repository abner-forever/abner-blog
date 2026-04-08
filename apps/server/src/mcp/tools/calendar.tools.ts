import { Injectable, Logger } from '@nestjs/common';
import { CalendarService } from '../../calendar/calendar.service';
import { UsersService } from '../../users/users.service';
import { McpRequestContextService } from '../services/mcp-request-context.service';
import type {
  ListEventsInput,
  CreateEventInput,
  UpdateEventInput,
  DeleteEventInput,
} from '../schemas';

@Injectable()
export class CalendarTools {
  private readonly logger = new Logger(CalendarTools.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly usersService: UsersService,
    private readonly requestContext: McpRequestContextService,
  ) {}

  /**
   * 列出指定日期范围的日程
   */
  async listEvents(params: ListEventsInput) {
    try {
      const userId = await this.resolveUserId();

      const events = await this.calendarService.findAll(
        userId,
        params.startDate,
        params.endDate,
      );

      if (!events || events.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `在 ${params.startDate} 到 ${params.endDate} 期间没有找到任何日程。`,
            },
          ],
          structuredContent: { events: [], total: 0 },
        };
      }

      const eventsText = events
        .map(
          (event) =>
            `- ${event.title}: ${event.startDate.toISOString()}${event.allDay ? ' (全天)' : ''}${event.location ? ` @ ${event.location}` : ''}${event.completed ? ' [已完成]' : ''}`,
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `在 ${params.startDate} 到 ${params.endDate} 期间共有 ${events.length} 个日程：\n${eventsText}`,
          },
        ],
        structuredContent: {
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            endDate: e.endDate,
            allDay: e.allDay,
            location: e.location,
            completed: e.completed,
          })),
          total: events.length,
        },
      };
    } catch (error) {
      this.logger.error(`listEvents tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `查询日程时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 创建新日程
   */
  async createEvent(params: CreateEventInput) {
    try {
      const userId = await this.resolveUserId();

      const eventData = {
        title: params.title,
        startDate: params.startDate,
        endDate: params.endDate,
        allDay: params.allDay,
        location: params.location,
        description: params.description,
      };

      const event = await this.calendarService.create(eventData, userId);

      return {
        content: [
          {
            type: 'text' as const,
            text: `日程创建成功：${event.title}，开始时间 ${event.startDate.toISOString()}${event.location ? `，地点 ${event.location}` : ''}`,
          },
        ],
        structuredContent: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          location: event.location,
        },
      };
    } catch (error) {
      this.logger.error(`createEvent tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `创建日程时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 更新日程
   */
  async updateEvent(params: UpdateEventInput) {
    try {
      const userId = await this.resolveUserId();

      const updateData: Record<string, unknown> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.startDate !== undefined)
        updateData.startDate = params.startDate;
      if (params.endDate !== undefined) updateData.endDate = params.endDate;
      if (params.allDay !== undefined) updateData.allDay = params.allDay;
      if (params.location !== undefined) updateData.location = params.location;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.completed !== undefined)
        updateData.completed = params.completed;

      const event = await this.calendarService.update(
        params.id,
        updateData,
        userId,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: `日程更新成功：${event.title}`,
          },
        ],
        structuredContent: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          location: event.location,
          completed: event.completed,
        },
      };
    } catch (error) {
      this.logger.error(`updateEvent tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `更新日程时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 删除日程
   */
  async deleteEvent(params: DeleteEventInput) {
    try {
      const userId = await this.resolveUserId();

      await this.calendarService.remove(params.id, userId);

      return {
        content: [
          {
            type: 'text' as const,
            text: `日程删除成功（ID: ${params.id}）`,
          },
        ],
        structuredContent: {
          deletedId: params.id,
          success: true,
        },
      };
    } catch (error) {
      this.logger.error(`deleteEvent tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `删除日程时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  private async resolveUserId(): Promise<number> {
    const userId = this.requestContext.getUserId();
    if (!userId) {
      throw new Error(
        '未登录或登录已过期。请先调用 mcp_auth 登录，或在 MCP headers 中配置 Bearer Token',
      );
    }

    await this.usersService.findById(userId);
    return userId;
  }
}
