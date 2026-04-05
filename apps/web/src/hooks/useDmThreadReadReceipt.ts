import { useEffect, useRef, type RefObject } from 'react';
import type { DirectMessageItem } from '@services/social';
import { markDmReadThrough } from '@services/social';

function isSeenNewer(
  a: { id: number; t: number },
  b: { id: number; t: number },
): boolean {
  if (a.t !== b.t) return a.t > b.t;
  return a.id > b.id;
}

function readDataAttrs(el: HTMLElement): { id: number; t: number } | null {
  const idRaw = el.getAttribute('data-message-id');
  const tRaw = el.getAttribute('data-message-created-ms');
  const id = idRaw != null ? Number(idRaw) : NaN;
  const t = tRaw != null ? Number(tRaw) : NaN;
  if (!Number.isFinite(id) || !Number.isFinite(t)) return null;
  return { id, t };
}

function maxMessageByTime(messages: DirectMessageItem[]): {
  id: number;
  t: number;
} | null {
  if (!messages.length) return null;
  let bestId = messages[0].id;
  let bestT = new Date(messages[0].createdAt).getTime();
  for (let i = 1; i < messages.length; i++) {
    const m = messages[i];
    const t = new Date(m.createdAt).getTime();
    if (isSeenNewer({ id: m.id, t }, { id: bestId, t: bestT })) {
      bestId = m.id;
      bestT = t;
    }
  }
  return { id: bestId, t: bestT };
}

/**
 * 当消息气泡进入聊天滚动容器可视范围时，上报已读游标。
 * 几何扫描 + IO + 「未溢出 / 接近底部」时用当前列表中最晚一条兜底（与自动滚底行为一致）。
 */
export function useDmThreadReadReceipt(
  threadRootRef: RefObject<HTMLElement | null>,
  conversationId: number | null,
  messages: DirectMessageItem[],
  msgLoading: boolean,
  onAck: () => void,
): void {
  const maxSeenRef = useRef<{ id: number; t: number }>({ id: 0, t: 0 });
  const debounceRef = useRef<number | undefined>(undefined);
  const conversationIdRef = useRef(conversationId);
  const onAckRef = useRef(onAck);
  const messagesRef = useRef(messages);

  useEffect(() => {
    onAckRef.current = onAck;
  }, [onAck]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    maxSeenRef.current = { id: 0, t: 0 };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || msgLoading || messages.length === 0) return;
    const root = threadRootRef.current;
    if (!root) return;

    const scheduleFlush = () => {
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        const { id } = maxSeenRef.current;
        const cid = conversationIdRef.current;
        if (!Number.isFinite(id) || id < 1 || !cid) return;
        void markDmReadThrough(cid, id)
          .then(() => {
            onAckRef.current();
          })
          .catch((err: unknown) => {
            if (import.meta.env.DEV) {
              console.warn('[dm read-through]', err);
            }
          });
      }, 320);
    };

    const considerVisible = (id: number, t: number) => {
      if (!Number.isFinite(id) || !Number.isFinite(t)) return;
      const next = { id, t };
      if (isSeenNewer(next, maxSeenRef.current)) {
        maxSeenRef.current = next;
        scheduleFlush();
      }
    };

    /** 列表在容器内无需滚动，或已滚到底部附近：当前页最晚一条视为已出现在会话可视区 */
    const applyBottomOrShortThreadRead = () => {
      const msgs = messagesRef.current;
      if (!msgs.length) return;
      const sh = root.scrollHeight;
      const ch = root.clientHeight;
      const st = root.scrollTop;
      const fullyFits = sh <= ch + 16;
      const nearBottom = sh - st - ch < 120;
      if (fullyFits || nearBottom) {
        const best = maxMessageByTime(msgs);
        if (best) considerVisible(best.id, best.t);
      }
    };

    const scanVisibleByGeometry = () => {
      const rootRect = root.getBoundingClientRect();
      const inset = 0;
      const vTop = rootRect.top + inset;
      const vBottom = rootRect.bottom - inset;
      root.querySelectorAll<HTMLElement>('[data-dm-anchor="1"]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom <= vTop || r.top >= vBottom) return;
        const parsed = readDataAttrs(el);
        if (parsed) considerVisible(parsed.id, parsed.t);
      });
      applyBottomOrShortThreadRead();
    };

    const onIntersect: IntersectionObserverCallback = (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const parsed = readDataAttrs(e.target as HTMLElement);
        if (parsed) considerVisible(parsed.id, parsed.t);
      }
    };

    const observer = new IntersectionObserver(onIntersect, {
      root,
      rootMargin: '20px 0px 20px 0px',
      threshold: [0, 0.01, 0.05, 0.15],
    });

    const bindObserver = () => {
      root.querySelectorAll<HTMLElement>('[data-dm-anchor="1"]').forEach((el) => {
        observer.observe(el);
      });
    };

    const onScroll = () => {
      window.requestAnimationFrame(scanVisibleByGeometry);
    };

    bindObserver();
    scanVisibleByGeometry();
    applyBottomOrShortThreadRead();

    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    let rafId = 0;
    let bindDelayId = 0;
    rafId = window.requestAnimationFrame(() => {
      bindObserver();
      scanVisibleByGeometry();
      bindDelayId = window.setTimeout(() => {
        bindObserver();
        scanVisibleByGeometry();
      }, 60);
    });

    const delayedScanIds: number[] = [0, 80, 200, 450, 800].map((ms) =>
      window.setTimeout(() => {
        bindObserver();
        scanVisibleByGeometry();
      }, ms),
    );

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(bindDelayId);
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current);
      }
      delayedScanIds.forEach((x) => window.clearTimeout(x));
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer.disconnect();
    };
  }, [conversationId, msgLoading, messages, threadRootRef]);
}
