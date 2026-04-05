export interface LoginByCodeDto {
  /** 邮箱地址 */
  email: string;
  /**
   * 6位验证码
   * @minLength 6
   * @maxLength 6
   */
  code: string;
}
