export interface CommentAuthorDto {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /**
   * 昵称（优先展示）
   * @nullable
   */
  nickname?: string | null;
  /**
   * 头像 URL
   * @nullable
   */
  avatar?: string | null;
}
