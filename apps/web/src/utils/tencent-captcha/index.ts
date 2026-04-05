export {
  TencentCaptchaUserClosedError,
  TencentCaptchaFailedError,
  TencentCaptchaScriptError,
} from './errors';
export { loadTJCaptchaScript } from './loadTJCaptchaScript';
export { showTencentCaptcha } from './showTencentCaptcha';
export type { TencentCaptchaShowOptions } from './showTencentCaptcha';
export {
  mapI18nToCaptchaUserLanguage,
  buildDefaultTencentCaptchaShowOptions,
} from './captchaAppearance';
export type { AuthCaptchaFields } from './resolveAuthCaptchaFields';
export { resolveAuthCaptchaFields } from './resolveAuthCaptchaFields';
