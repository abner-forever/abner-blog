import {
  AnalyticsConfig,
  PerformanceMetrics,
  ClientInfo,
  DEFAULT_CONFIG,
} from './events';
import {
  generateAnonymousId,
  generateSessionId,
  getClientInfo,
  getPageUrl,
  getPageTitle,
  getReferrer,
  isOnline,
} from './utils';
import { Queue } from './queue';
import { performanceCollector } from './performance';
import { autoTracker } from './auto-track';

type SendStrategy = 'immediate' | 'queue' | 'batch';

interface TrackerOptions {
  config: AnalyticsConfig;
  sendStrategy?: SendStrategy;
  batchInterval?: number;
}

class AnalyticsTracker {
  private config: AnalyticsConfig;
  private queue: Queue<TrackEventPayload>;
  private performanceQueue: Queue<PerformancePayload>;
  private clientInfo: ClientInfo;
  private anonymousId: string;
  private sessionId: string;
  private userId: number | null = null;
  private sendStrategy: SendStrategy;
  private isInitialized = false;
  private performanceUpdateHandler: () => void;

  constructor(options: TrackerOptions) {
    this.config = { ...DEFAULT_CONFIG, ...options.config } as AnalyticsConfig;
    this.sendStrategy = options.sendStrategy || 'queue';
    this.queue = new Queue<TrackEventPayload>();
    this.performanceQueue = new Queue<PerformancePayload>();
    this.performanceUpdateHandler = () => this.onPerformanceUpdate();

    this.clientInfo = getClientInfo();
    this.anonymousId = generateAnonymousId();
    this.sessionId = generateSessionId();

    this.queue.onFlush = () => this.flushQueues();
    this.performanceQueue.onFlush = () => this.flushPerformanceQueue();
  }

  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    if (this.config.autoTrack) {
      // Register handler BEFORE init so first page_view is captured
      autoTracker.onTrack((event) => {
        this.track(event.eventName, event.eventData);
      });

      autoTracker.init({
        trackPageView: true,
        trackClick: true,
        trackError: true,
        trackFetch: true,
        trackHistoryChange: true,
      });
    }

    performanceCollector.init();
    performanceCollector.onUpdate(this.performanceUpdateHandler);

    this.setupSessionManagement();

    if (this.config.debug) {
      console.log('[Analytics] Initialized with config:', this.config);
    }
  }

  private setupSessionManagement(): void {
    const sessionTimeout = this.config.sessionTimeout || 30 * 60 * 1000;
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const checkSession = () => {
      if (Date.now() - lastActivity > sessionTimeout) {
        this.sessionId = generateSessionId();
        if (this.config.debug) {
          console.log('[Analytics] Session expired, new session:', this.sessionId);
        }
      }
    };

    if (typeof window !== 'undefined') {
      ['click', 'scroll', 'keypress', 'mousemove'].forEach((event) => {
        window.addEventListener(event, updateActivity, { passive: true });
      });

      setInterval(checkSession, 60000);
    }
  }

  private onPerformanceUpdate(): void {
    const metrics = performanceCollector.getMetrics();
    this.sendPerformanceMetrics(metrics);
  }

  track(eventName: string, eventData?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      this.init();
    }

    if (!this.shouldSample()) return;

    const payload = this.buildTrackPayload(eventName, eventData);

    if (this.sendStrategy === 'immediate') {
      this.sendImmediate(payload);
    } else {
      this.queue.push(payload);
    }
  }

  trackPageView(): void {
    this.track('page_view', {
      pageUrl: getPageUrl(),
      pageTitle: getPageTitle(),
      referrer: getReferrer(),
    });
  }

  trackClick(element: HTMLElement, eventName?: string, extra?: Record<string, unknown>): void {
    const data: Record<string, unknown> = {
      pageUrl: getPageUrl(),
      pageTitle: getPageTitle(),
    };

    if (element.id) data.elementId = element.id;
    if (element.className) data.elementClass = element.className;
    if (element.tagName) data.elementTag = element.tagName.toLowerCase();
    if (element.textContent?.trim()) {
      data.elementText = element.textContent.trim().substring(0, 100);
    }

    if (extra) {
      Object.assign(data, extra);
    }

    this.track(eventName || 'click', data);
  }

  private buildTrackPayload(eventName: string, eventData?: Record<string, unknown>): TrackEventPayload {
    return {
      eventName,
      eventData,
      userId: this.userId,
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      pageUrl: getPageUrl(),
      pageTitle: getPageTitle(),
      referrer: getReferrer(),
      ip: '',
      userAgent: this.clientInfo.userAgent,
      deviceType: this.clientInfo.deviceType,
      browser: this.clientInfo.browser,
      os: this.clientInfo.os,
    };
  }

  private sendImmediate(payload: TrackEventPayload): void {
    if (!isOnline()) {
      this.queue.push(payload);
      return;
    }

    this.sendToServer(payload).catch(() => {
      this.queue.push(payload);
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-anonymous-id': this.anonymousId,
      'x-session-id': this.sessionId,
    };

    if (this.config.getToken) {
      const token = this.config.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async sendToServer(payload: TrackEventPayload): Promise<void> {
    const response = await fetch(`${this.config.serverUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'x-anonymous-id': payload.anonymousId,
        'x-session-id': payload.sessionId,
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Analytics request failed: ${response.status}`);
    }
  }

  private async sendBatchToServer(items: TrackEventPayload[]): Promise<boolean> {
    if (!isOnline()) return false;

    try {
      const response = await fetch(`${this.config.serverUrl}/api/analytics/track/batch`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ events: items }),
        credentials: 'include',
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private async flushQueues(): Promise<void> {
    const eventResult = await this.queue.flush((items) => this.sendBatchToServer(items));

    if (this.config.debug) {
      console.log(
        `[Analytics] Flushed ${eventResult.success} events, ${eventResult.failed} failed`,
      );
    }
  }

  private async flushPerformanceQueue(): Promise<void> {
    const result = await this.performanceQueue.flush((items) => this.sendPerformanceBatchToServer(items));

    if (this.config.debug) {
      console.log(
        `[Analytics] Flushed ${result.success} performance metrics, ${result.failed} failed`,
      );
    }
  }

  private async sendPerformanceBatchToServer(items: PerformancePayload[]): Promise<boolean> {
    if (!isOnline()) return false;

    try {
      const response = await fetch(`${this.config.serverUrl}/api/analytics/performance`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(items[0]),
        credentials: 'include',
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private sendPerformanceMetrics(metrics: PerformanceMetrics): void {
    if (!this.shouldSample()) return;

    const payload: PerformancePayload = {
      ...metrics,
      userId: this.userId,
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      pageUrl: getPageUrl(),
    };

    this.performanceQueue.push(payload);
  }

  setUserId(userId: number): void {
    this.userId = userId;
    if (this.config.debug) {
      console.log('[Analytics] User ID set:', userId);
    }
  }

  clearUser(): void {
    this.userId = null;
    this.anonymousId = generateAnonymousId();
    this.sessionId = generateSessionId();
    if (this.config.debug) {
      console.log('[Analytics] User cleared, new anonymous ID:', this.anonymousId);
    }
  }

  getAnonymousId(): string {
    return this.anonymousId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  private shouldSample(): boolean {
    return Math.random() < (this.config.sampleRate || 0.15);
  }

  getQueueSize(): number {
    return this.queue.size();
  }

  destroy(): void {
    autoTracker.destroy();
    this.queue.destroy();
    this.performanceQueue.destroy();
    this.isInitialized = false;
  }
}

interface TrackEventPayload {
  eventName: string;
  eventData?: Record<string, unknown>;
  userId: number | null;
  anonymousId: string;
  sessionId: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  ip: string;
  userAgent: string;
  deviceType: string;
  browser: string;
  os: string;
}

interface PerformancePayload extends PerformanceMetrics {
  userId: number | null;
  anonymousId: string;
  sessionId: string;
  pageUrl: string;
}

let trackerInstance: AnalyticsTracker | null = null;

export function createTracker(options: TrackerOptions): AnalyticsTracker {
  if (trackerInstance) {
    trackerInstance.destroy();
  }
  trackerInstance = new AnalyticsTracker(options);
  return trackerInstance;
}

export function getTracker(): AnalyticsTracker | null {
  return trackerInstance;
}

export { AnalyticsTracker };
