import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('modern-screenshot', () => ({
  domToBlob: vi.fn().mockResolvedValue(
    new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
  ),
}));

describe('copyElementImageToClipboard', () => {
  beforeEach(() => {
    class MockClipboardItem {
      types: string[];
      constructor(public data: Record<string, unknown>) {
        this.types = Object.keys(data);
      }
      getType(type: string): Promise<Blob> {
        const v = this.data[type];
        if (v instanceof Promise) return v as Promise<Blob>;
        if (v instanceof Blob) return Promise.resolve(v);
        return Promise.reject(new Error('missing'));
      }
    }
    vi.stubGlobal(
      'ClipboardItem',
      MockClipboardItem as unknown as typeof ClipboardItem,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('passes image/png as Promise into ClipboardItem (keeps user activation)', async () => {
    const writeSpy = vi.fn(async (items: ClipboardItem[]) => {
      const item = items[0];
      expect(item.types).toContain('image/png');
      const blob = await item.getType('image/png');
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('image/png');
    });

    vi.stubGlobal('navigator', {
      clipboard: { write: writeSpy },
    });

    const { copyElementImageToClipboard } = await import('./export-chat-image');

    const el = document.createElement('div');
    el.style.width = '10px';
    el.style.height = '10px';
    document.body.appendChild(el);

    await copyElementImageToClipboard(el);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const ctorArg = writeSpy.mock.calls[0][0][0] as unknown as {
      data: Record<string, unknown>;
    };
    expect(ctorArg.data['image/png']).toBeInstanceOf(Promise);

    el.remove();
  });
});
