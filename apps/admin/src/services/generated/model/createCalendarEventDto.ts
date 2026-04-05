import type { CreateCalendarEventDtoType } from "./createCalendarEventDtoType";

export interface CreateCalendarEventDto {
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description?: string;
  /** 开始时间（ISO 8601） */
  startDate: string;
  /** 结束时间（ISO 8601） */
  endDate?: string;
  /** 事件类型 */
  type?: CreateCalendarEventDtoType;
  /** 是否全天事件 */
  allDay?: boolean;
  /** 地点 */
  location?: string;
  /** 颜色（十六进制） */
  color?: string;
  /** 是否公开 */
  isPublic?: boolean;
}
