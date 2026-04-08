import type { AnalyticsControllerGetPerformanceStatsGranularity } from "./analyticsControllerGetPerformanceStatsGranularity";

export type AnalyticsControllerGetPerformanceStatsParams = {
  /**
   * 开始时间
   */
  startTime: string;
  /**
   * 结束时间
   */
  endTime: string;
  /**
   * 时间粒度
   */
  granularity?: AnalyticsControllerGetPerformanceStatsGranularity;
  /**
   * 页面URL
   */
  pageUrl?: string;
};
