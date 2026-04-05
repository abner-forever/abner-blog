export {};

/** 腾讯云 TJCaptcha.js 全局构造器（动态加载后存在） */
type TencentCaptchaGlobalCallback = (res: {
  ret: number;
  ticket?: string | null;
  randstr?: string | null;
  errorCode?: number;
  errorMessage?: string;
}) => void;

type TencentCaptchaGlobalCtor = new (
  appId: string,
  callback: TencentCaptchaGlobalCallback,
  options?: { userLanguage?: string; [key: string]: unknown },
) => {
  show: () => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    __INITIAL_DATA__?: Record<string, unknown>;
    /** @abner-blog/env-tool IIFE 全局单例（axios / AI 请求读取 getEnv） */
    AbnerEnvTool?: {
      init: (options?: Record<string, unknown>) => void;
      getEnv: () => Promise<string>;
    };
    TencentCaptcha?: TencentCaptchaGlobalCtor;
  }
}
