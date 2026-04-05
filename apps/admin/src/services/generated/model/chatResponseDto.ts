import type { ChatResponseDtoData } from "./chatResponseDtoData";
import type { ChatResponseDtoScheduleDataItem } from "./chatResponseDtoScheduleDataItem";
import type { ChatResponseDtoType } from "./chatResponseDtoType";
import type { ClarificationNeededDto } from "./clarificationNeededDto";

export interface ChatResponseDto {
  /** 响应类型 */
  type: ChatResponseDtoType;
  /** 聊天内容（type=chat 时） */
  content?: string;
  /** 创建的数据（type=todo_created/event_created 时） */
  data?: ChatResponseDtoData;
  /** 日程列表（type=schedule_query 时） */
  scheduleData?: ChatResponseDtoScheduleDataItem[];
  /** 需要补充的信息（type=clarification_needed 时） */
  clarification?: ClarificationNeededDto;
  /** 错误信息（type=error 时） */
  error?: string;
}
