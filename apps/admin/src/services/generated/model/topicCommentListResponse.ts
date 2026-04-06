import type { TopicCommentDto } from "./topicCommentDto";

export interface TopicCommentListResponse {
  /** 评论列表 */
  list: TopicCommentDto[];
  /** 总数量 */
  total: number;
}
