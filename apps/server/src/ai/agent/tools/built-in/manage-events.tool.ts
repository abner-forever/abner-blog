/**
 * manage_events 工具
 *
 * 创建/更新/删除/查询日程事件。
 * MCP → DirectService 优雅降级。
 */

import { tool, type DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import type { ChatLLM } from '../../../langchain/model';
import { AICommandService } from '../../../services/ai-command.service';

/** manage_events 工具参数 schema */
const manageEventsSchema = z.object({
  action: z
    .enum(['create', 'update', 'delete', 'query'])
    .describe('操作类型：create=创建，update=更新，delete=删除，query=查询'),
  title: z.string().optional().describe('日程标题（create/update 时必填）'),
  startTime: z.string().optional().describe('开始时间 ISO 字符串'),
  endTime: z.string().optional().describe('结束时间 ISO 字符串（可选）'),
  location: z.string().optional().describe('地点（可选）'),
  id: z.number().optional().describe('日程 ID（delete/update 时使用）'),
  allDay: z.boolean().optional().describe('是否为全天事件（可选）'),
});

/**
 * 创建 manage_events 工具
 */
export function createManageEventsTool(
  commandService: AICommandService,
  llm: ChatLLM,
  userId: number,
  currentDate: string,
): DynamicStructuredTool {
  return tool(
    async ({
      action,
      title,
      startTime,
      endTime,
      location,
      id,
      allDay,
    }: z.infer<typeof manageEventsSchema>) => {
      try {
        switch (action) {
          case 'create': {
            if (!title) {
              return JSON.stringify({
                status: 'error',
                error: '创建日程需要提供标题（title）',
              });
            }
            // 构建自然语言消息供 commandService 解析
            let messageText = `创建日程: ${title}`;
            if (startTime) {
              const date = new Date(startTime);
              messageText = `${date.getMonth() + 1}月${date.getDate()}日 ${title}`;
              if (endTime) {
                messageText += ` ${startTime} 到 ${endTime}`;
              }
            }
            if (location) messageText += ` 地点: ${location}`;
            if (allDay) messageText += ' 全天';

            const result = await commandService.handleCreateEvent(
              llm,
              messageText,
              userId,
              currentDate,
            );
            return JSON.stringify({
              status: 'success',
              type: result.type,
              data: result.data,
            });
          }

          case 'update': {
            if (!id && !title) {
              return JSON.stringify({
                status: 'error',
                error: '更新日程需要提供 id',
              });
            }
            const messageParts = [
              title ? `修改日程: ${title}` : `修改日程 #${id}`,
            ];
            if (startTime) messageParts.push(`时间: ${startTime}`);
            if (endTime) messageParts.push(`结束: ${endTime}`);
            if (location) messageParts.push(`地点: ${location}`);

            const result = await commandService.handleUpdateEvent(
              llm,
              messageParts.join(', '),
              userId,
              currentDate,
            );
            return JSON.stringify({
              status: 'success',
              type: result.type,
              data: result.data,
            });
          }

          case 'delete': {
            const message = title ? `取消日程: ${title}` : `取消日程 #${id}`;
            const result = await commandService.handleDeleteEvent(
              llm,
              message,
              userId,
              currentDate,
            );
            return JSON.stringify({
              status: 'success',
              type: result.type,
              data: result.data,
            });
          }

          case 'query': {
            const result = await commandService.handleQuerySchedule(
              llm,
              userId,
            );
            return JSON.stringify({
              status: 'success',
              type: result.type,
              data: result.scheduleData,
              analysis: result.scheduleAnalysis,
            });
          }

          default:
            return JSON.stringify({
              status: 'error',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              error: `未知操作: ${action as any}`,
            });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          status: 'error',
          error: `日程操作失败: ${msg}`,
        });
      }
    },
    {
      name: 'manage_events',
      description: `创建、更新、删除或查询日程事件。用 action 参数指定操作：create=创建新日程（需 title + startTime），delete=删除（需 id 或 title），update=更新（需 id，可选 title/startTime/endTime/location），query=查询所有当前日程。`,
      schema: manageEventsSchema,
    },
  );
}
