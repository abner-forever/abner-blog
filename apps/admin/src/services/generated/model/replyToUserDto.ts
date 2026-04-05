export interface ReplyToUserDto {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /**
   * 昵称（优先展示）
   * @nullable
   */
  nickname?: string | null;
}
