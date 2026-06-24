/**
 * 超时控制工具函数
 *
 * 为异步操作添加超时能力，超时时自动 Abort 底层请求并抛出 TimeoutError。
 * 支持 AbortSignal 链式传递，让底层 fetch/stream 可以提前释放资源。
 */

export class TimeoutError extends Error {
  constructor(ms: number, label?: string) {
    super(
      label
        ? `Operation timed out after ${ms}ms: ${label}`
        : `Operation timed out after ${ms}ms`,
    );
    this.name = 'TimeoutError';
  }
}

export interface WithTimeoutOptions {
  /** 超时毫秒数 */
  ms: number;
  /** 操作标识（用于错误消息） */
  label?: string;
  /** 外部 AbortSignal（与超时共同作用） */
  signal?: AbortSignal;
}

/**
 * 为 Promise 添加超时能力
 *
 * 返回 [resultPromise, abortController]：
 * - resultPromise：带超时的 Promise
 * - abortController：外部可在超时前手动取消
 *
 * @example
 * const [promise, ac] = withTimeout(fetch(url), { ms: 5000, label: 'fetch LLM' });
 * const result = await promise;
 */
export function withTimeout<T>(
  promise: Promise<T>,
  options: WithTimeoutOptions,
): { promise: Promise<T>; abort: () => void } {
  const { ms, label } = options;

  // 如果提供了外部 signal，当外部 signal 中止时也抛错
  if (options.signal?.aborted) {
    return {
      promise: Promise.reject(
        new Error(String(options.signal.reason ?? 'Aborted')),
      ),
      abort: () => {},
    };
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const onExternalAbort = () => {
    clearTimeout(timer);
    controller.abort(options.signal?.reason);
  };

  if (options.signal) {
    options.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(ms, label));
    }, ms);
  });

  const resultPromise = Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
    if (options.signal) {
      options.signal.removeEventListener('abort', onExternalAbort);
    }
  });

  return {
    promise: resultPromise,
    abort: () => {
      clearTimeout(timer);
      controller.abort();
    },
  };
}

/**
 * LLM provider 默认超时（毫秒）
 */
export const LLM_TIMEOUT_MS: Record<string, number> = {
  openai: 60_000,
  anthropic: 90_000,
  gemini: 60_000,
  deepseek: 60_000,
  qwen: 60_000,
  minimax: 120_000,
};

/**
 * 非 LLM 外部调用超时
 */
export const KB_SEARCH_TIMEOUT_MS = 5_000;
export const WEB_SEARCH_TIMEOUT_MS = 10_000;
export const SKILLS_TIMEOUT_MS = 5_000;
