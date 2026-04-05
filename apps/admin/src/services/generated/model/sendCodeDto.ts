export interface SendCodeDto {
  /** 邮箱地址 */
  email: string;
  /** 腾讯云验证码 ticket（服务端启用验证码时必填，见 GET /auth/captcha-config） */
  captchaTicket?: string;
  /** 腾讯云验证码 randstr（服务端启用验证码时必填） */
  captchaRandstr?: string;
}
