/** 用户关闭验证码弹窗 */
export class TencentCaptchaUserClosedError extends Error {
  constructor() {
    super('TencentCaptchaUserClosed');
    this.name = 'TencentCaptchaUserClosedError';
  }
}

/** 容灾票据或校验未通过 */
export class TencentCaptchaFailedError extends Error {
  constructor(message = 'TencentCaptchaFailed') {
    super(message);
    this.name = 'TencentCaptchaFailedError';
  }
}

/** TJCaptcha.js 加载失败 */
export class TencentCaptchaScriptError extends Error {
  constructor() {
    super('TencentCaptchaScriptError');
    this.name = 'TencentCaptchaScriptError';
  }
}
