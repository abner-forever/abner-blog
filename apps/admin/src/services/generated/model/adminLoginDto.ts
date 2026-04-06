export interface AdminLoginDto {
  /** 管理员用户名 */
  username: string;
  /**
   * 密码
   * @minLength 6
   */
  password: string;
}
