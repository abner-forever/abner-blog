export interface CaptchaConfigResponseDto {
  /** 是否启用腾讯云滑块验证码 */
  enabled: boolean;
  /**
   * 验证码应用 ID（启用时返回，供前端 TJCaptcha 使用）
   * @nullable
   */
  captchaAppId?: number | null;
}
