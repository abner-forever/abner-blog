export interface CreateCommentDto {
  /**
   * 评论内容（最多1000字）
   * @maxLength 1000
   */
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
