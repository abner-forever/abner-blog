export interface ResetPasswordDto {
  /** 重置令牌（邮件中获取） */
  token: string;
  /** 新密码 */
  newPassword: string;
}
