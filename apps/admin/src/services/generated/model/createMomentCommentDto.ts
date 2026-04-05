export interface CreateMomentCommentDto {
  /** 评论内容 */
  content: string;
  /**
   * 父评论 ID（回复时使用）
   * @minimum 1
   */
  parentId?: number;
  /**
   * 被回复用户 ID
   * @minimum 1
   */
  replyToUserId?: number;
}
