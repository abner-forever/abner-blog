import type { TopicDto } from "./topicDto";

export interface TopicListResponse {
  /** 话题列表 */
  list: TopicDto[];
  /** 总数 */
  total: number;
}
