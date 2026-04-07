export {
  AnalyticsConfig,
  TrackEvent,
  PerformanceMetrics,
  ClientInfo,
  DeviceType,
  Browser,
  OS,
  DEFAULT_CONFIG,
} from './events';

export { createTracker, getTracker, AnalyticsTracker } from './tracker';
export { performanceCollector } from './performance';
export { autoTracker } from './auto-track';

export {
  generateAnonymousId,
  generateSessionId,
  getClientInfo,
  getConnectionType,
  debounce,
  getPageUrl,
  getPageTitle,
  getReferrer,
  isOnline,
} from './utils';

export { Queue, QueueItem } from './queue';

import { createTracker, AnalyticsTracker } from './tracker';
import { AnalyticsConfig } from './events';

let defaultTracker: AnalyticsTracker | null = null;

export function initAnalytics(config: AnalyticsConfig): AnalyticsTracker {
  if (!defaultTracker) {
    defaultTracker = createTracker({ config });
    defaultTracker.init();
  }
  return defaultTracker;
}

export function getAnalytics(): AnalyticsTracker | null {
  return defaultTracker;
}

export function track(eventName: string, eventData?: Record<string, unknown>): void {
  if (defaultTracker) {
    defaultTracker.track(eventName, eventData);
  }
}

export function trackPageView(): void {
  if (defaultTracker) {
    defaultTracker.trackPageView();
  }
}

export function setUserId(userId: number): void {
  if (defaultTracker) {
    defaultTracker.setUserId(userId);
  }
}

export function clearUser(): void {
  if (defaultTracker) {
    defaultTracker.clearUser();
  }
}

export function getAnonymousId(): string {
  if (defaultTracker) {
    return defaultTracker.getAnonymousId();
  }
  return '';
}

export function getSessionId(): string {
  if (defaultTracker) {
    return defaultTracker.getSessionId();
  }
  return '';
}
