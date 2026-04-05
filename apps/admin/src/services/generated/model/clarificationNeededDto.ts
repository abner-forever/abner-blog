import type { ClarificationNeededDtoIntent } from "./clarificationNeededDtoIntent";
import type { ClarificationNeededDtoPartialData } from "./clarificationNeededDtoPartialData";

export interface ClarificationNeededDto {
  /** 意图类型 */
  intent: ClarificationNeededDtoIntent;
  /** 缺失的字段列表 */
  missingFields: string[];
  /** 已提取的部分数据 */
  partialData: ClarificationNeededDtoPartialData;
  /** 补充信息的建议 */
  suggestion: string;
}
