import { z } from 'zod';

/** 列出待办参数 */
export const ListTodosSchema = z.object({
  completed: z
    .boolean()
    .optional()
    .describe('筛选已完成/未完成的待办，不提供则返回全部'),
});

export type ListTodosInput = z.infer<typeof ListTodosSchema>;

/** 创建待办参数 */
export const CreateTodoSchema = z.object({
  title: z.string().describe('待办标题，如"完成项目报告"、"购买食材"'),
  description: z.string().optional().describe('待办详细描述'),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

/** 更新待办参数 */
export const UpdateTodoSchema = z.object({
  id: z.number().describe('待办 ID'),
  title: z.string().optional().describe('新的待办标题'),
  description: z.string().optional().describe('新的描述'),
  completed: z.boolean().optional().describe('是否已完成'),
});

export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

/** 删除待办参数 */
export const DeleteTodoSchema = z.object({
  id: z.number().describe('要删除的待办 ID'),
});

export type DeleteTodoInput = z.infer<typeof DeleteTodoSchema>;
