export interface TrackEvent {
  eventName: string;
  eventData?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  inputDelay?: number;
  navigationType?: string;
  connectionType?: string;
  devicePixelRatio?: number;
  viewportSize?: string;
}

export interface AnalyticsConfig {
  appId: string;
  serverUrl: string;
  sessionTimeout?: number;
  sampleRate?: number;
  autoTrack?: boolean;
  debug?: boolean;
  getToken?: () => string | null;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'other';
export type OS = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';

export interface ClientInfo {
  deviceType: DeviceType;
  browser: Browser;
  os: OS;
  userAgent: string;
  language: string;
  viewportSize: string;
  devicePixelRatio: number;
}

export const DEFAULT_CONFIG: Partial<AnalyticsConfig> = {
  sessionTimeout: 30 * 60 * 1000,
  sampleRate: 0.15,
  autoTrack: true,
  debug: false,
};
