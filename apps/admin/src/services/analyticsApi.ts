import { httpMutator } from './http';

const BASE_URL = '/api/analytics';

export interface TrackEventDto {
  eventName: string;
  eventData?: Record<string, unknown>;
}

export interface TrackEventResponse {
  id: number;
  eventName: string;
  eventData?: Record<string, unknown>;
  userId?: number;
  anonymousId: string;
  sessionId: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  ip?: string;
  userAgent?: string;
  deviceType: string;
  browser: string;
  os: string;
  createdAt: string;
}

export interface PerformanceMetricDto {
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

export interface PerformanceMetricResponse {
  id: number;
  userId?: number;
  anonymousId: string;
  sessionId: string;
  pageUrl: string;
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
  createdAt: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface QueryTrackEventsParams extends PaginationParams {
  eventName?: string;
  userId?: number;
  pageUrl?: string;
  startTime?: string;
  endTime?: string;
}

export interface QueryPerformanceMetricsParams extends PaginationParams {
  userId?: number;
  pageUrl?: string;
  startTime?: string;
  endTime?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TimeSeriesPoint {
  time: string;
  count: number;
}

export interface PerformanceStatsPoint {
  time: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

export interface TopPage {
  pageUrl: string;
  avgLcp: number;
  avgCls: number;
  count: number;
}

// 新增类型
export interface OverviewStats {
  totalEvents: number;
  totalPv: number;
  uv: number;
  clickEvents: number;
  errorEvents: number;
}

export interface EventTrend {
  time: string;
  page_view?: number;
  click?: number;
  js_error?: number;
  [key: string]: number | string | undefined;
}

export interface UserItem {
  anonymousId: string;
  userId: number | null;
  eventCount: number;
  pageCount: number;
  firstVisit: string;
  lastVisit: string;
}

export interface UserListResponse {
  list: UserItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageViewStat {
  time: string;
  pageUrl: string;
  pv: number;
  uv: number;
}

export interface ClickStat {
  time: string;
  count: number;
  elementTag: string;
  elementText: string;
  pageUrl: string;
}

export interface PopularPage {
  pageUrl: string;
  pv: number;
  uv: number;
}

export const analyticsApi = {
  // 事件列表
  getTrackEvents(params: QueryTrackEventsParams): Promise<PaginatedResponse<TrackEventResponse>> {
    return httpMutator({
      url: `${BASE_URL}/events`,
      method: 'GET',
      params,
    });
  },

  getTrackEventStats(params: {
    eventName: string;
    startTime: string;
    endTime: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<TimeSeriesPoint[]> {
    return httpMutator({
      url: `${BASE_URL}/events/stats`,
      method: 'GET',
      params,
    });
  },

  // 性能数据
  getPerformanceMetrics(params: QueryPerformanceMetricsParams): Promise<PaginatedResponse<PerformanceMetricResponse>> {
    return httpMutator({
      url: `${BASE_URL}/performance`,
      method: 'GET',
      params,
    });
  },

  getPerformanceStats(params: {
    startTime: string;
    endTime: string;
    granularity?: string;
    pageUrl?: string;
  }): Promise<PerformanceStatsPoint[]> {
    return httpMutator({
      url: `${BASE_URL}/performance/stats`,
      method: 'GET',
      params,
    });
  },

  getTopPages(params: { limit?: number }): Promise<TopPage[]> {
    return httpMutator({
      url: `${BASE_URL}/performance/top-pages`,
      method: 'GET',
      params,
    });
  },

  // 概览统计
  getOverview(params: { startTime: string; endTime: string }): Promise<OverviewStats> {
    return httpMutator({
      url: `${BASE_URL}/overview`,
      method: 'GET',
      params,
    });
  },

  // 事件趋势
  getEventTrend(params: { startTime: string; endTime: string; granularity?: string }): Promise<EventTrend[]> {
    return httpMutator({
      url: `${BASE_URL}/trend`,
      method: 'GET',
      params,
    });
  },

  // 用户列表
  getUserList(params: { startTime?: string; endTime?: string; page?: number; pageSize?: number }): Promise<UserListResponse> {
    return httpMutator({
      url: `${BASE_URL}/users`,
      method: 'GET',
      params,
    });
  },

  // 用户行为详情
  getUserBehavior(params: {
    anonymousId: string;
    startTime?: string;
    endTime?: string;
    eventName?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<TrackEventResponse>> {
    return httpMutator({
      url: `${BASE_URL}/users/${params.anonymousId}`,
      method: 'GET',
      params,
    });
  },

  // 页面访问统计
  getPageViewStats(params: { startTime: string; endTime: string; granularity?: string }): Promise<PageViewStat[]> {
    return httpMutator({
      url: `${BASE_URL}/pageviews`,
      method: 'GET',
      params,
    });
  },

  // 点击事件统计
  getClickStats(params: { startTime: string; endTime: string; granularity?: string }): Promise<ClickStat[]> {
    return httpMutator({
      url: `${BASE_URL}/clicks`,
      method: 'GET',
      params,
    });
  },

  // 热门页面
  getPopularPages(params: { limit?: number }): Promise<PopularPage[]> {
    return httpMutator({
      url: `${BASE_URL}/popular-pages`,
      method: 'GET',
      params,
    });
  },
};
