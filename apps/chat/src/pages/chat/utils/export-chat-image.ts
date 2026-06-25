import { domToBlob } from 'modern-screenshot';

/** 控制台过滤用前缀，例如 DevTools 里搜 `chat:copy-image` */
export const CHAT_COPY_IMAGE_DEBUG_TAG = '[chat:copy-image]';

const CAPTURE_BACKGROUND = '#f3f4f6';

/**
 * 复制图片失败时打印结构化信息，便于本地/测试环境排查。
 * 不依赖 import.meta.env，避免生产环境无日志。
 */
export function logChatCopyImageFailure(
  stage: string,
  err: unknown,
  context?: Record<string, unknown>,
): void {
  const payload: Record<string, unknown> = {
    stage,
    ...context,
  };
  if (err instanceof DOMException) {
    payload.kind = 'DOMException';
    payload.name = err.name;
    payload.message = err.message;
    payload.code = err.code;
  } else if (err instanceof Error) {
    payload.kind = 'Error';
    payload.name = err.name;
    payload.message = err.message;
    payload.stack = err.stack;
  } else {
    payload.kind = typeof err;
    payload.value = err;
  }
  console.error(CHAT_COPY_IMAGE_DEBUG_TAG, 'failure', payload);
}

export function sanitizeChatImageFilename(name: string): string {
  return name.replace(/[^\w\u4e00-\u9fa5.-]+/g, '_').slice(0, 80) || 'chat';
}

function pickCaptureScale(width: number, height: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  let scale = Math.min(2, Math.max(1, dpr));
  const maxEdge = 8192;
  while (width * scale > maxEdge || height * scale > maxEdge) {
    scale *= 0.75;
    if (scale < 0.5) break;
  }
  return scale;
}

function captureFilter(node: Node): boolean {
  if (node instanceof HTMLIFrameElement || node instanceof HTMLScriptElement) {
    return false;
  }
  return true;
}

async function captureElementToPngBlob(element: HTMLElement): Promise<Blob> {
  const w = Math.ceil(
    Math.max(element.scrollWidth, element.offsetWidth, element.clientWidth, 1),
  );
  const h = Math.ceil(
    Math.max(element.scrollHeight, element.offsetHeight, element.clientHeight, 1),
  );
  const scale = pickCaptureScale(w, h);

  const blob = await domToBlob(element, {
    width: w,
    height: h,
    scale,
    type: 'image/png',
    backgroundColor: CAPTURE_BACKGROUND,
    filter: captureFilter,
    timeout: 20000,
  });

  if (!blob || blob.size === 0) {
    throw new Error('to_blob_failed');
  }
  const type = blob.type.toLowerCase();
  if (type === 'image/png') {
    return blob;
  }
  const buf = await blob.arrayBuffer();
  return new Blob([buf], { type: 'image/png' });
}

/** 将离屏对话预览 DOM 渲染为 PNG Blob（复制与下载共用） */
export async function renderChatCaptureToPngBlob(element: HTMLElement): Promise<Blob> {
  try {
    return await captureElementToPngBlob(element);
  } catch (err) {
    logChatCopyImageFailure('pngPipeline', err, {
      tagName: element.tagName,
      childCount: element.childElementCount,
      scrollW: element.scrollWidth,
      scrollH: element.scrollHeight,
      offsetW: element.offsetWidth,
      offsetH: element.offsetHeight,
    });
    throw err;
  }
}

/**
 * 将 DOM 区域渲染为 PNG 并写入系统剪贴板。
 * 必须在用户点击等手势处理函数内调用；内部在**同步**调用 `clipboard.write` 时传入
 * `ClipboardItem({ 'image/png': Promise<Blob> })`，由浏览器在仍有效的手势上下文中延后读取
 * PNG 数据。若先 await 整段截图再 write，手势会失效，导致复制失败（Chrome 常见）。
 */
export async function copyElementImageToClipboard(element: HTMLElement): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.write) {
    logChatCopyImageFailure('precheck', new Error('clipboard_write_unavailable'), {
      hasNavigator: typeof navigator !== 'undefined',
      hasClipboard: typeof navigator !== 'undefined' && !!navigator.clipboard,
      hasWrite:
        typeof navigator !== 'undefined' &&
        !!navigator.clipboard &&
        typeof navigator.clipboard.write === 'function',
    });
    throw new Error('clipboard_write_unavailable');
  }
  if (typeof ClipboardItem === 'undefined') {
    logChatCopyImageFailure('precheck', new Error('clipboard_item_unsupported'), {});
    throw new Error('clipboard_item_unsupported');
  }

  const pngData = renderChatCaptureToPngBlob(element);

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': pngData,
      }),
    ]);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotAllowedError') {
      logChatCopyImageFailure('clipboard.write', e, {
        mappedTo: 'clipboard_not_allowed',
        isSecureContext:
          typeof window !== 'undefined' ? window.isSecureContext : undefined,
      });
      throw new Error('clipboard_not_allowed');
    }
    logChatCopyImageFailure('clipboard.write', e, {
      isSecureContext:
        typeof window !== 'undefined' ? window.isSecureContext : undefined,
    });
    throw e;
  }
}

/** 将 DOM 区域渲染为 PNG 并触发本地下载 */
export async function downloadElementImageAsPng(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const blob = await renderChatCaptureToPngBlob(element);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
