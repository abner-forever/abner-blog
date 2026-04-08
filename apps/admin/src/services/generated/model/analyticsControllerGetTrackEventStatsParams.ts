import type { AnalyticsControllerGetTrackEventStatsGranularity } from "./analyticsControllerGetTrackEventStatsGranularity";

export type AnalyticsControllerGetTrackEventStatsParams = {
  /**
   * 事件名称
   */
  eventName: string;
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
  granularity?: AnalyticsControllerGetTrackEventStatsGranularity;
};
