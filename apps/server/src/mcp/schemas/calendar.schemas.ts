import { z } from 'zod';

/** 列出日程参数 */
export const ListEventsSchema = z.object({
  startDate: z
    .string()
    .describe('开始日期，格式为 YYYY-MM-DD，如 "2026-04-01"'),
  endDate: z.string().describe('结束日期，格式为 YYYY-MM-DD，如 "2026-04-07"'),
});

export type ListEventsInput = z.infer<typeof ListEventsSchema>;

/** 创建日程参数 */
export const CreateEventSchema = z.object({
  title: z.string().describe('日程标题，如"团队周会"、"医生预约"'),
  startDate: z
    .string()
    .describe('开始时间，ISO 8601 格式，如 "2026-04-09T09:00:00Z"'),
  endDate: z
    .string()
    .optional()
    .describe('结束时间，ISO 8601 格式，如 "2026-04-09T10:00:00Z"'),
  allDay: z.boolean().optional().describe('是否全天事件，默认 false'),
  location: z.string().optional().describe('日程地点，如"会议室A"、"线上"'),
  description: z.string().optional().describe('日程描述'),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

/** 更新日程参数 */
export const UpdateEventSchema = z.object({
  id: z.number().describe('日程 ID'),
  title: z.string().optional().describe('新的日程标题'),
  startDate: z.string().optional().describe('新的开始时间'),
  endDate: z.string().optional().describe('新的结束时间'),
  allDay: z.boolean().optional().describe('是否全天事件'),
  location: z.string().optional().describe('新的地点'),
  description: z.string().optional().describe('新的描述'),
  completed: z.boolean().optional().describe('是否已完成'),
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

/** 删除日程参数 */
export const DeleteEventSchema = z.object({
  id: z.number().describe('要删除的日程 ID'),
});

export type DeleteEventInput = z.infer<typeof DeleteEventSchema>;
