import {
  TencentCaptchaFailedError,
  TencentCaptchaUserClosedError,
} from './errors';
import { loadTJCaptchaScript } from './loadTJCaptchaScript';

/** 与腾讯云 TJCaptcha options 对齐的可选项，见 Web 接入文档 */
export interface TencentCaptchaShowOptions {
  userLanguage?: string;
  /** true：自适应深夜；'force'：强制深夜（与站点深色模式对齐时建议用 force） */
  enableDarkMode?: boolean | 'force';
  /** 加载过程是否显示 loading 框；不传则走 SDK 默认（默认显示） */
  loading?: boolean;
  /** 文档：仅移动端原生 WebView 场景下设置 loading 弹窗尺寸；Web 亦可按需传入 */
  sdkOpts?: { width?: number; height?: number };
  /**
   * 弹窗整体缩放，对应文档建议在 .tcaptcha-transform 上使用 transform: scale。
   * 1 为默认；例如 0.92 略缩小。
   */
  scale?: number;
  /** 渲染完成回调（duration、sid）；若同时传 scale，会在内部先应用缩放再调用你的 showFn */
  showFn?: (ret: { duration?: number; sid?: string }) => void;
  needFeedBack?: boolean | string;
  bizState?: unknown;
}

const CAPTCHA_SCALE_VAR = '--tencent-captcha-scale';

function setCaptchaRootScale(scale: number | undefined): void {
  if (typeof document === 'undefined') return;
  if (scale != null && scale > 0 && scale !== 1) {
    document.documentElement.style.setProperty(
      CAPTCHA_SCALE_VAR,
      String(scale),
    );
  } else {
    document.documentElement.style.removeProperty(CAPTCHA_SCALE_VAR);
  }
}

function buildCtorOptions(
  options: TencentCaptchaShowOptions | undefined,
): Record<string, unknown> {
  const o = options ?? {};
  const ctorOpts: Record<string, unknown> = {
    userLanguage: o.userLanguage ?? 'zh-cn',
  };
  if (o.enableDarkMode !== undefined) {
    ctorOpts.enableDarkMode = o.enableDarkMode;
  }
  if (o.loading !== undefined) {
    ctorOpts.loading = o.loading;
  }
  if (o.sdkOpts) {
    ctorOpts.sdkOpts = o.sdkOpts;
  }
  if (o.needFeedBack !== undefined) {
    ctorOpts.needFeedBack = o.needFeedBack;
  }
  if (o.bizState !== undefined) {
    ctorOpts.bizState = o.bizState;
  }

  const userShowFn = o.showFn;
  const needScaleHook = o.scale != null && o.scale !== 1;
  if (userShowFn || needScaleHook) {
    ctorOpts.showFn = (ret: { duration?: number; sid?: string }) => {
      if (needScaleHook) {
        setCaptchaRootScale(o.scale);
      }
      userShowFn?.(ret);
    };
  }

  return ctorOpts;
}

/**
 * 弹出腾讯云滑块/图形验证，成功返回 ticket + randstr（供服务端 DescribeCaptchaResult）。
 */
export async function showTencentCaptcha(
  captchaAppId: number,
  options?: TencentCaptchaShowOptions,
): Promise<{ ticket: string; randstr: string }> {
  await loadTJCaptchaScript();
  const Ctor = window.TencentCaptcha;
  if (!Ctor) {
    throw new TencentCaptchaFailedError();
  }

  setCaptchaRootScale(
    options?.scale != null && options.scale !== 1 ? options.scale : undefined,
  );

  try {
    return await new Promise<{ ticket: string; randstr: string }>(
      (resolve, reject) => {
        const callback = (res: TencentCaptchaCallbackResult) => {
          if (res.ret === 2) {
            reject(new TencentCaptchaUserClosedError());
            return;
          }
          if (res.ret === 0 && res.ticket && res.randstr) {
            if (res.ticket.startsWith('trerror_')) {
              reject(new TencentCaptchaFailedError());
              return;
            }
            resolve({ ticket: res.ticket, randstr: res.randstr });
            return;
          }
          reject(new TencentCaptchaFailedError());
        };

        try {
          const ctorOpts = buildCtorOptions(options);
          const instance = new Ctor(
            String(captchaAppId),
            callback,
            ctorOpts,
          );
          instance.show();
        } catch {
          reject(new TencentCaptchaFailedError());
        }
      },
    );
  } finally {
    setCaptchaRootScale(undefined);
  }
}

interface TencentCaptchaCallbackResult {
  ret: number;
  ticket?: string | null;
  randstr?: string | null;
  errorCode?: number;
  errorMessage?: string;
}
