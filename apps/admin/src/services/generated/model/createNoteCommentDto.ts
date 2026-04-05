export interface CreateNoteCommentDto {
  /** 评论内容 */
  content: string;
  /** 父评论ID */
  parentId?: number;
  /** 回复用户ID */
  replyToUserId?: number;
}
