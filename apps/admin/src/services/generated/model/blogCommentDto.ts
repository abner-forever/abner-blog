import type { BlogDto } from "./blogDto";
import type { CommentAuthorDto } from "./commentAuthorDto";
import type { ParentCommentRefDto } from "./parentCommentRefDto";
import type { ReplyToUserDto } from "./replyToUserDto";

export interface BlogCommentDto {
  /** 评论 ID */
  id: number;
  /** 评论内容 */
  content: string;
  /** 点赞数 */
  likeCount: number;
  /** 当前用户是否已点赞 */
  isLiked?: boolean;
  /** 评论作者 */
  author: CommentAuthorDto;
  /** 被回复用户 */
  replyToUser?: ReplyToUserDto | null;
  /** 父评论引用 */
  parentComment?: ParentCommentRefDto | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 博客信息 */
  blog: BlogDto | null;
}
