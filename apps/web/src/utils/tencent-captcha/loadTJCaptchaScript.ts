import { TencentCaptchaScriptError } from './errors';

const TJ_CAPTCHA_SCRIPT_SRC =
  'https://turing.captcha.qcloud.com/TJCaptcha.js';

let loadPromise: Promise<void> | null = null;

/**
 * 动态加载腾讯云验证码 2.0 脚本（须按官方要求动态引入）。
 */
export function loadTJCaptchaScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new TencentCaptchaScriptError());
  }
  if (window.TencentCaptcha) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TJ_CAPTCHA_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => {
          loadPromise = null;
          reject(new TencentCaptchaScriptError());
        },
        { once: true },
      );
      return;
    }
    const script = document.createElement('script');
    script.src = TJ_CAPTCHA_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new TencentCaptchaScriptError());
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
