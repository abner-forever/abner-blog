export interface RegisterDto {
  /**
   * 用户名（3-20位字母数字）
   * @minLength 3
   * @maxLength 20
   * @pattern /^[a-zA-Z0-9]+$/
   */
  username: string;
  /**
   * 昵称（可选，不填则随机生成）
   * @maxLength 30
   */
  nickname?: string;
  /** 邮箱 */
  email: string;
  /**
   * 密码（6-32位）
   * @minLength 6
   * @maxLength 32
   */
  password: string;
}
