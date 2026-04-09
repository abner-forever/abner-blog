import { useEffect, useRef, type RefObject } from 'react';
import { markDmReadThrough } from '@services/social';

export type DmThreadTailMeta = {
  id: number;
  createdMs: number;
};

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

/**
 * 与滚动容器「内容可视区」相交检测（扣除 padding，含水平方向）。
 * 此前仅用 border box 且忽略左右，在 flex + padding 下容易出现假阴性，导致已读 API 一直不触发。
 */
function scanVisibleInThread(
  root: HTMLElement,
  onVisible: (id: number, t: number) => void,
): void {
  const rr = root.getBoundingClientRect();
  const cs = getComputedStyle(root);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;

  const vTop = rr.top + pt;
  const vBottom = rr.bottom - pb;
  const vLeft = rr.left + pl;
  const vRight = rr.right - pr;

  if (vBottom <= vTop || vRight <= vLeft) return;

  root.querySelectorAll<HTMLElement>('[data-dm-anchor="1"]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom <= vTop || r.top >= vBottom) return;
    if (r.right <= vLeft || r.left >= vRight) return;
    const parsed = readDataAttrs(el);
    if (parsed) onVisible(parsed.id, parsed.t);
  });
}

/**  trailing：首事件后固定时刻上报，期间只更新 maxSeenRef，避免对方连发时反复 clearTimeout 导致永不触发 */
const FLUSH_DEBOUNCE_MS = 150;

/**
 * 私信线程：可视区内出现过的消息推进已读游标；滚到底/短会话时用列表最后一条兜底
 * （与「发一条消息红点才消失」一致：新气泡触发扫描后游标才越过对方消息）。
 */
export function useDmThreadReadReceipt(
  threadRootRef: RefObject<HTMLElement | null>,
  conversationId: number | null,
  messageIdsKey: string,
  msgLoading: boolean,
  messagesDataUpdatedAt: number,
  /** 当前列表按时间最后一条（chronological latest），用于滚到底时的已读兜底 */
  threadTail: DmThreadTailMeta | null,
  onAck: () => void,
): void {
  const maxSeenRef = useRef<{ id: number; t: number }>({ id: 0, t: 0 });
  const debounceRef = useRef<number | undefined>(undefined);
  const onAckRef = useRef(onAck);
  const runScanRef = useRef<(() => void) | null>(null);
  const threadTailRef = useRef<DmThreadTailMeta | null>(threadTail);
  threadTailRef.current = threadTail;

  useEffect(() => {
    onAckRef.current = onAck;
  }, [onAck]);

  useEffect(() => {
    maxSeenRef.current = { id: 0, t: 0 };
  }, [conversationId]);

  /** 勿把整段 messageIdsKey 放进依赖：对方连发时 key 每变一次就 teardown，会清掉 trailing 定时器导致长时间不发已读 */
  const hasThreadMessages = messageIdsKey.length > 0;

  useEffect(() => {
    const convIdThisInstance = conversationId;
    if (!convIdThisInstance || msgLoading || !hasThreadMessages) return;
    const root = threadRootRef.current;
    if (!root) return;

    const clearFlushTimer = () => {
      if (debounceRef.current !== undefined) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }
    };

    const scheduleFlushTrailing = () => {
      if (debounceRef.current !== undefined) return;
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = undefined;
        const { id } = maxSeenRef.current;
        if (!Number.isFinite(id) || id < 1) return;
        void markDmReadThrough(convIdThisInstance, id)
          .then(() => {
            onAckRef.current();
          })
          .catch((err: unknown) => {
            console.warn('[dm read-through]', err);
          });
      }, FLUSH_DEBOUNCE_MS);
    };

    const considerVisible = (id: number, t: number) => {
      if (!Number.isFinite(id) || !Number.isFinite(t)) return;
      const next = { id, t };
      if (isSeenNewer(next, maxSeenRef.current)) {
        maxSeenRef.current = next;
        scheduleFlushTrailing();
      }
    };

    /**
     * 在滚到底部或内容不足以产生滚动时，将已读推进到当前页时间轴上最后一条。
     * 解决纯几何扫描在部分布局下无法命中对方气泡、只有发消息触达 MutationObserver 才更新游标的问题。
     */
    const applyTailWhenViewportShowsLatest = () => {
      const tail = threadTailRef.current;
      if (!tail || !Number.isFinite(tail.id) || tail.id < 1) return;
      const el = root;
      const sh = el.scrollHeight;
      const ch = el.clientHeight;
      if (ch < 2 || sh < 1) return;
      const st = el.scrollTop;
      const nearBottom = sh - st - ch < 24;
      const shortThread = sh <= ch + 16;
      if (nearBottom || shortThread) {
        considerVisible(tail.id, tail.createdMs);
      }
    };

    const runScan = () => {
      scanVisibleInThread(root, considerVisible);
      applyTailWhenViewportShowsLatest();
    };
    runScanRef.current = runScan;

    const onScrollOrResize = () => {
      window.requestAnimationFrame(runScan);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || e.intersectionRatio <= 0) continue;
          const parsed = readDataAttrs(e.target as HTMLElement);
          if (parsed) considerVisible(parsed.id, parsed.t);
        }
      },
      {
        root,
        rootMargin: '0px',
        threshold: [0, 0.01, 0.05, 0.1, 0.25],
      },
    );

    const bindIntersectionTargets = () => {
      root.querySelectorAll<HTMLElement>('[data-dm-anchor="1"]').forEach((el) => {
        intersectionObserver.observe(el);
      });
    };

    let mutationRaf = 0;
    const scheduleScanFromMutation = () => {
      if (mutationRaf !== 0) {
        window.cancelAnimationFrame(mutationRaf);
      }
      mutationRaf = window.requestAnimationFrame(() => {
        mutationRaf = 0;
        bindIntersectionTargets();
        runScan();
      });
    };

    const mutationObserver = new MutationObserver(() => {
      scheduleScanFromMutation();
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    bindIntersectionTargets();
    runScan();
    root.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    const ro = new ResizeObserver(() => {
      onScrollOrResize();
    });
    ro.observe(root);

    const retryIds = [0, 24, 72, 160, 360, 720].map((ms) =>
      window.setTimeout(onScrollOrResize, ms),
    );

    return () => {
      runScanRef.current = null;
      intersectionObserver.disconnect();
      if (mutationRaf !== 0) {
        window.cancelAnimationFrame(mutationRaf);
      }
      mutationObserver.disconnect();
      ro.disconnect();
      retryIds.forEach((x) => window.clearTimeout(x));
      root.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      clearFlushTimer();
      const { id } = maxSeenRef.current;
      if (Number.isFinite(id) && id >= 1) {
        void markDmReadThrough(convIdThisInstance, id)
          .then(() => {
            onAckRef.current();
          })
          .catch((err: unknown) => {
            console.warn('[dm read-through teardown]', err);
          });
      }
    };
  }, [conversationId, msgLoading, hasThreadMessages, threadRootRef]);

  useEffect(() => {
    if (!conversationId || msgLoading || !hasThreadMessages || messagesDataUpdatedAt <= 0) {
      return;
    }
    const tick = () => {
      runScanRef.current?.();
    };
    queueMicrotask(tick);
    const raf = window.requestAnimationFrame(tick);
    const t = window.setTimeout(tick, 0);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [conversationId, msgLoading, hasThreadMessages, messagesDataUpdatedAt]);
}
