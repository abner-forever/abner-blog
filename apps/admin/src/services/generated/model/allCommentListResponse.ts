import type { CommentType } from "./commentType";

export interface AllCommentListResponse {
  /** 评论列表 */
  list: CommentType;
  /** 总数量 */
  total: number;
}
