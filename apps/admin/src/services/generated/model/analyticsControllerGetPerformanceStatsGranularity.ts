export type AnalyticsControllerGetPerformanceStatsGranularity =
  (typeof AnalyticsControllerGetPerformanceStatsGranularity)[keyof typeof AnalyticsControllerGetPerformanceStatsGranularity];

export const AnalyticsControllerGetPerformanceStatsGranularity = {
  hour: "hour",
  day: "day",
  week: "week",
  month: "month",
} as const;
