import { PerformanceMetrics } from './events';
import { getConnectionType } from './utils';

interface CustomPerformanceEntry {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

type PerformanceObserverCallback = (metrics: PerformanceMetrics) => void;

class PerformanceCollector {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserverCallback[] = [];
  private isInitialized = false;

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.collectNavigationTiming();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();

    window.addEventListener('pageshow', (event) => {
      const pageshowEvent = event as Event & { persisted?: boolean };
      if (pageshowEvent.persisted) {
        this.metrics = {};
        this.init();
      }
    });
  }

  private collectNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const timing = performance.timing;
    if (!timing) return;

    const navigationStart = timing.navigationStart;

    const ttfb = timing.responseStart - navigationStart;
    this.metrics.ttfb = ttfb > 0 ? ttfb : undefined;

    this.metrics.navigationType = performance.navigation?.type === 1 ? 'back_forward' : 'normal';
    this.metrics.connectionType = getConnectionType();
    this.metrics.viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    this.metrics.devicePixelRatio = window.devicePixelRatio || 1;
  }

  private observeLCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && 'value' in lastEntry) {
          this.metrics.lcp = (lastEntry as CustomPerformanceEntry).value;
          this.notifyObservers();
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }
  }

  private observeFID(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if ('processingStart' in entry) {
            const firstInput = entry as unknown as { processingStart: number; startTime: number };
            const fid = firstInput.processingStart - firstInput.startTime;
            this.metrics.fid = fid > 0 ? fid : undefined;
            this.notifyObservers();
          }
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }
  }

  private observeCLS(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let hasEntries = false;

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if ('hadRecentInput' in entry) {
            const hasRecentInput = (entry as { hadRecentInput: boolean }).hadRecentInput;
            if (!hasRecentInput && 'value' in entry) {
              clsValue += (entry as CustomPerformanceEntry).value;
              hasEntries = true;
            }
          }
        }

        if (hasEntries) {
          this.metrics.cls = clsValue;
          this.notifyObservers();
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
    }
  }

  private observeFCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.notifyObservers();
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // FCP not supported
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  onUpdate(callback: PerformanceObserverCallback): () => void {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  private notifyObservers(): void {
    const metrics = this.getMetrics();
    this.observers.forEach((cb) => cb(metrics));
  }
  
  reset(): void {
    this.metrics = {};
  }
}

export const performanceCollector = new PerformanceCollector();
