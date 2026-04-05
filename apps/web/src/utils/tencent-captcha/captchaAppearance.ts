import i18n from '@/i18n';
import type { TencentCaptchaShowOptions } from './showTencentCaptcha';

/** i18next 语言码 → 腾讯云 userLanguage（见文档 userLanguage 表） */
export function mapI18nToCaptchaUserLanguage(lng: string): string {
  const norm = lng.toLowerCase().replace('_', '-');
  if (norm.startsWith('zh-tw')) return 'zh-tw';
  if (norm.startsWith('zh-hk')) return 'zh-hk';
  if (norm.startsWith('zh')) return 'zh-cn';
  if (norm.startsWith('en')) return 'en';
  if (norm.startsWith('ja')) return 'ja';
  if (norm.startsWith('ko')) return 'ko';
  return 'zh-cn';
}

function isDocumentDarkTheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * 与站点主题 / 语言对齐的默认验证码外观（可被 resolveAuthCaptchaFields 的 overrides 覆盖）。
 */
export function buildDefaultTencentCaptchaShowOptions(): Partial<TencentCaptchaShowOptions> {
  const userLanguage = mapI18nToCaptchaUserLanguage(
    i18n.language || 'zh-CN',
  );
  const out: Partial<TencentCaptchaShowOptions> = { userLanguage };
  if (isDocumentDarkTheme()) {
    out.enableDarkMode = 'force';
  }
  return out;
}
