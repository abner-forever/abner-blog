/* eslint-disable @typescript-eslint/no-explicit-any */
import { TrackEvent } from './events';
import { getPageUrl, getPageTitle, getReferrer } from './utils';

type AutoTrackEventHandler = (event: TrackEvent) => void;

interface AutoTrackConfig {
  trackPageView: boolean;
  trackClick: boolean;
  trackError: boolean;
  trackFetch: boolean;
  trackHistoryChange: boolean;
}

const DEFAULT_AUTO_TRACK_CONFIG: AutoTrackConfig = {
  trackPageView: true,
  trackClick: true,
  trackError: true,
  trackFetch: true,
  trackHistoryChange: true,
};

class AutoTracker {
  private handlers: AutoTrackEventHandler[] = [];
  private config: AutoTrackConfig = DEFAULT_AUTO_TRACK_CONFIG;
  private boundHandlers: { type: string; handler: any; element?: EventTarget }[] = [];
  private clickDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  init(config?: Partial<AutoTrackConfig>): void {
    if (typeof window === 'undefined') return;

    this.config = { ...DEFAULT_AUTO_TRACK_CONFIG, ...config };

    if (this.config.trackPageView) {
      this.trackPageView();
    }

    if (this.config.trackClick) {
      this.initClickTracking();
    }

    if (this.config.trackError) {
      this.initErrorTracking();
    }

    if (this.config.trackFetch) {
      this.initFetchTracking();
    }

    if (this.config.trackHistoryChange) {
      this.initHistoryTracking();
    }
  }

  private trackPageView(): void {
    const event: TrackEvent = {
      eventName: 'page_view',
      eventData: {
        pageUrl: getPageUrl(),
        pageTitle: getPageTitle(),
        referrer: getReferrer(),
      },
    };
    this.emit(event);
  }

  private initClickTracking(): void {
    const handleClick = (e: MouseEvent) => {
      if (this.clickDebounceTimer) {
        clearTimeout(this.clickDebounceTimer);
      }

      this.clickDebounceTimer = setTimeout(() => {
        const target = e.target as HTMLElement;

        // Find the element to track (with data-track attribute or use target directly)
        const trackElement = this.findTrackElement(target);
        if (!trackElement) return;

        // Check if explicitly ignored
        if (this.shouldIgnore(trackElement)) return;

        const eventName = (trackElement as HTMLElement).dataset['trackEvent'] || 'click';
        const eventData: Record<string, unknown> = {
          pageUrl: getPageUrl(),
          pageTitle: getPageTitle(),
        };

        if (trackElement.id) {
          eventData.elementId = trackElement.id;
        }

        if (trackElement.className) {
          eventData.elementClass = trackElement.className;
        }

        if (trackElement.tagName) {
          eventData.elementTag = trackElement.tagName.toLowerCase();
        }

        if (trackElement.textContent?.trim()) {
          eventData.elementText = trackElement.textContent.trim().substring(0, 100);
        }

        const trackData = (trackElement as HTMLElement).dataset['trackData'];
        if (trackData) {
          try {
            eventData.extra = JSON.parse(trackData);
          } catch {
            eventData.extra = trackData;
          }
        }

        const event: TrackEvent = {
          eventName,
          eventData,
        };

        this.emit(event);
      }, 100);
    };

    document.addEventListener('click', handleClick, true);
    this.boundHandlers.push({ type: 'click', handler: handleClick, element: document });
  }

  private shouldIgnore(element: HTMLElement): boolean {
    // Only ignore if explicitly marked with data-track-ignore
    return element.dataset['trackIgnore'] !== undefined;
  }

  private findTrackElement(element: HTMLElement): HTMLElement | null {
    // If element has data-track, use it
    if (element.dataset['track'] !== undefined) {
      return element;
    }

    // Otherwise check parent for data-track
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      if (current.dataset['track'] !== undefined) {
        return current;
      }
      current = current.parentElement;
    }

    // If no data-track found, return the clicked element itself for click tracking
    return element;

    return null;
  }

  private initErrorTracking(): void {
    const handleError = (errorEvent: ErrorEvent) => {
      const errorData: Record<string, unknown> = {
        pageUrl: getPageUrl(),
        pageTitle: getPageTitle(),
        message: errorEvent.message,
        filename: errorEvent.filename,
        lineno: errorEvent.lineno,
        colno: errorEvent.colno,
      };

      const trackEvent: TrackEvent = {
        eventName: 'js_error',
        eventData: errorData,
      };

      this.emit(trackEvent);
    };

    window.addEventListener('error', handleError);
    this.boundHandlers.push({ type: 'error', handler: handleError, element: window });

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const eventData: Record<string, unknown> = {
        pageUrl: getPageUrl(),
        pageTitle: getPageTitle(),
        reason: event.reason?.message || String(event.reason),
      };

      const trackEvent: TrackEvent = {
        eventName: 'unhandled_promise_error',
        eventData,
      };

      this.emit(trackEvent);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    this.boundHandlers.push({ type: 'unhandledrejection', handler: handleUnhandledRejection, element: window });
  }

  private initFetchTracking(): void {
    const originalFetch = window.fetch.bind(window);

    const trackFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const startTime = Date.now();
      const requestInfo = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      const sendRequest = (): Promise<Response> => {
        if (input instanceof Request || input instanceof URL) {
          return originalFetch(input, init);
        }
        return originalFetch(input as RequestInfo, init);
      };

      return sendRequest()
        .then((response) => {
          const duration = Date.now() - startTime;

          if (!response.ok && response.status >= 400) {
            const event: TrackEvent = {
              eventName: 'fetch_error',
              eventData: {
                pageUrl: getPageUrl(),
                pageTitle: getPageTitle(),
                url: requestInfo,
                status: response.status,
                statusText: response.statusText,
                duration,
              },
            };
            this.emit(event);
          }

          return response;
        })
        .catch((error) => {
          const duration = Date.now() - startTime;
          const event: TrackEvent = {
            eventName: 'fetch_error',
            eventData: {
              pageUrl: getPageUrl(),
              pageTitle: getPageTitle(),
              url: requestInfo,
              error: error instanceof Error ? error.message : String(error),
              duration,
            },
          };
          this.emit(event);
          throw error;
        });
    };

    window.fetch = trackFetch as typeof fetch;
  }

  private initHistoryTracking(): void {
    const handlePopState = () => {
      this.trackPageView();
    };

    const _history = history as any;
    const originalPushState = _history.pushState.bind(_history);
    const originalReplaceState = _history.replaceState.bind(_history);

    _history.pushState = (...args: unknown[]) => {
      originalPushState(...args);
      this.trackPageView();
    };

    _history.replaceState = (...args: unknown[]) => {
      originalReplaceState(...args);
      this.trackPageView();
    };

    window.addEventListener('popstate', handlePopState);
    this.boundHandlers.push({ type: 'popstate', handler: handlePopState, element: window });
  }

  onTrack(handler: AutoTrackEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private emit(event: TrackEvent): void {
    this.handlers.forEach((handler) => handler(event));
  }

  destroy(): void {
    this.boundHandlers.forEach(({ type, handler, element }) => {
      if (element) {
        element.removeEventListener(type, handler);
      } else {
        document.removeEventListener(type, handler, true);
        window.removeEventListener(type, handler);
      }
    });
    this.boundHandlers = [];
    this.handlers = [];
    if (this.clickDebounceTimer) {
      clearTimeout(this.clickDebounceTimer);
    }
  }
}

export const autoTracker = new AutoTracker();
