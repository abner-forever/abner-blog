import type { BlogCommentDto } from "./blogCommentDto";

export interface BlogCommentListResponse {
  /** 评论列表 */
  list: BlogCommentDto[];
  /** 总数量 */
  total: number;
}
