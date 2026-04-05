export interface UpdateProfileDto {
  /**
   * 用户名（只能英文，修改次数有限）
   * @maxLength 20
   * @pattern /^[a-zA-Z0-9]+$/
   */
  username?: string;
  /**
   * 昵称（可以是中文）
   * @maxLength 30
   */
  nickname?: string;
  /** 邮箱 */
  email?: string;
  /** 头像 URL */
  avatar?: string;
  /**
   * 个人简介
   * @maxLength 100
   */
  bio?: string;
}
