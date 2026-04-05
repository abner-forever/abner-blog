export interface BlogAuthorDto {
  /** 作者 ID */
  id: number;
  /** 作者用户名 */
  username: string;
  /**
   * 作者昵称（优先展示）
   * @nullable
   */
  nickname?: string | null;
  /**
   * 作者头像 URL
   * @nullable
   */
  avatar?: string | null;
}
