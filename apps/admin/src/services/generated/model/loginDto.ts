export interface LoginDto {
  /** 用户名 */
  username: string;
  /**
   * 密码
   * @minLength 1
   */
  password: string;
  /** 腾讯云验证码 ticket（服务端启用验证码时必填，见 GET /auth/captcha-config） */
  captchaTicket?: string;
  /** 腾讯云验证码 randstr（服务端启用验证码时必填） */
  captchaRandstr?: string;
}
