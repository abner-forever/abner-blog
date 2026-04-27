const QUEUE_KEY = '_a_q';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;

export interface QueueItem<T = unknown> {
  id: string;
  data: T;
  retries: number;
  timestamp: number;
}

export class Queue<T = unknown> {
  private queue: QueueItem<T>[] = [];
  private isProcessing = false;
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private flushIntervalMs: number = 5000) {
    this.loadFromStorage();
    this.startFlushInterval();
  }

  push(data: T): void {
    const item: QueueItem<T> = {
      id: this.generateId(),
      data,
      retries: 0,
      timestamp: Date.now(),
    };

    this.queue.push(item);

    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift();
    }

    this.saveToStorage();
  }

  pushBatch(items: T[]): void {
    for (const data of items) {
      const item: QueueItem<T> = {
        id: this.generateId(),
        data,
        retries: 0,
        timestamp: Date.now(),
      };
      this.queue.push(item);
    }

    while (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift();
    }

    this.saveToStorage();
  }
  /**
   * 执行发送
   * @param sender - 发送函数
   * @returns - 发送结果
   */
  async flush(sender: (items: T[]) => Promise<boolean>): Promise<{ success: number; failed: number }> {
    if (this.isProcessing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    let success = 0;
    let failed = 0;

    const itemsToSend = [...this.queue];
    const failedItems: QueueItem<T>[] = [];

    try {
      const result = await sender(itemsToSend.map((item) => item.data));
      if (result) {
        success = itemsToSend.length;
        this.queue = failedItems;
      } else {
        for (const item of itemsToSend) {
          item.retries++;
          if (item.retries >= MAX_RETRIES) {
            failed++;
          } else {
            failedItems.push(item);
          }
        }
        this.queue = failedItems;
      }
    } catch {
      for (const item of itemsToSend) {
        item.retries++;
        if (item.retries >= MAX_RETRIES) {
          failed++;
        } else {
          failedItems.push(item);
        }
      }
      this.queue = failedItems;
    }

    this.saveToStorage();
    this.isProcessing = false;

    return { success, failed };
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  private startFlushInterval(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.triggerFlush();
      }
    }, this.flushIntervalMs);

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.triggerFlush();
      });

      if ('visibilityState' in document) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.triggerFlush();
          }
        });
      }
    }
  }

  private triggerFlush(): void {
    // Fire and forget - actual flush is handled by the tracker
    if (this.onFlush) {
      this.onFlush();
    }
  }

  onFlush?: () => void;

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // Storage full or unavailable
      console.warn('[Analytics] Failed to save queue to storage');
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}
