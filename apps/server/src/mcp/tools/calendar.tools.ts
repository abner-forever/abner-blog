import { Injectable, Logger } from '@nestjs/common';
import { CalendarService } from '../../calendar/calendar.service';
import type {
  ListEventsInput,
  CreateEventInput,
  UpdateEventInput,
  DeleteEventInput,
} from '../schemas';

@Injectable()
export class CalendarTools {
  private readonly logger = new Logger(CalendarTools.name);

  constructor(private readonly calendarService: CalendarService) {}

  /**
   * 列出指定日期范围的日程
   */
  async listEvents(params: ListEventsInput) {
    try {
      const userId = this.getCurrentUserId();

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
      // 获取当前用户 ID（从请求上下文）
      const userId = this.getCurrentUserId();

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
      const userId = this.getCurrentUserId();

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
      const userId = this.getCurrentUserId();

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

  /**
   * 获取当前用户 ID（需要从请求上下文获取）
   * 这里使用一个临时实现，实际需要通过请求上下文获取
   */
  private getCurrentUserId(): number {
    // TODO: 从请求上下文获取真实用户 ID
    // 临时返回 1，实际实现需要注入 Request 上下文
    return 1;
  }
}
