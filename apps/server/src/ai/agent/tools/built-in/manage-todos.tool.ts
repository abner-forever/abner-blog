/**
 * manage_todos 工具
 *
 * 创建/更新/删除/查询待办事项。
 * MCP → DirectService 优雅降级。
 */

import { tool, type DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import type { ChatLLM } from '../../../langchain/model';
import { AICommandService } from '../../../services/ai-command.service';

/** manage_todos 工具参数 schema */
const manageTodosSchema = z.object({
  action: z
    .enum(['create', 'update', 'delete', 'query'])
    .describe('操作类型：create=创建，update=更新，delete=删除，query=查询'),
  title: z.string().optional().describe('待办标题（create/update 时必填）'),
  dueDate: z.string().optional().describe('截止日期 ISO 字符串（可选）'),
  id: z.number().optional().describe('待办 ID（delete/update 时使用）'),
  completed: z.boolean().optional().describe('是否已完成（update 时可选）'),
});

/**
 * 创建 manage_todos 工具
 *
 * 委托 AICommandService 处理（MCP 优先，降级到 DirectService）。
 */
export function createManageTodosTool(
  commandService: AICommandService,
  llm: ChatLLM,
  userId: number,
): DynamicStructuredTool {
  return tool(
    async ({
      action,
      title,
      id,
      completed,
    }: z.infer<typeof manageTodosSchema>) => {
      try {
        switch (action) {
          case 'create': {
            if (!title) {
              return JSON.stringify({
                status: 'error',
                error: '创建待办需要提供标题（title）',
              });
            }
            const messageText = `创建待办: ${title}`;
            const result = await commandService.handleCreateTodo(
              llm,
              messageText,
              userId,
            );
            return JSON.stringify({
              status: 'success',
              type: result.type,
              data: result.data,
            });
          }

          case 'update': {
            if (!id) {
              return JSON.stringify({
                status: 'error',
                error: '更新待办需要提供 id',
              });
            }
            const messageParts = [`更新待办 #${id}`];
            if (title) messageParts.push(`标题: ${title}`);
            if (completed !== undefined)
              messageParts.push(`完成: ${completed}`);
            const result = await commandService.handleUpdateTodo(
              messageParts.join(', '),
              userId,
            );
            return JSON.stringify({
              status: 'success',
              type: result.type,
              data: result.data,
            });
          }

          case 'delete': {
            const message = title ? `删除待办: ${title}` : `删除待办 #${id}`;
            const result = await commandService.handleDeleteTodo(
              message,
              userId,
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
          error: `待办操作失败: ${msg}`,
        });
      }
    },
    {
      name: 'manage_todos',
      description: `创建、更新、删除或查询待办事项（任务/提醒）。用 action 参数指定操作：create=创建新待办（需 title），update=更新（需 id，可选提供 title/completed 修改待办），delete=删除（需 id 或 title），query=查询当前所有待办和日程安排。`,
      schema: manageTodosSchema,
    },
  );
}
