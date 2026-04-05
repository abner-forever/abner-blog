import type { CalendarEventDtoType } from "./calendarEventDtoType";

export interface CalendarEventDto {
  /** 事件 ID */
  id: number;
  /** 事件标题 */
  title: string;
  /**
   * 事件描述
   * @nullable
   */
  description?: string | null;
  /** 开始时间 */
  startDate: string;
  /**
   * 结束时间
   * @nullable
   */
  endDate?: string | null;
  /** 事件类型 */
  type: CalendarEventDtoType;
  /** 是否全天事件 */
  allDay: boolean;
  /**
   * 地点
   * @nullable
   */
  location?: string | null;
  /**
   * 颜色
   * @nullable
   */
  color?: string | null;
  /** 是否公开 */
  isPublic: boolean;
  /** 是否已完成 */
  completed: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}
