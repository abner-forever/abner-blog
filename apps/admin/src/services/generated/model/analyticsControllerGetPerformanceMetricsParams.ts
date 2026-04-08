export type AnalyticsControllerGetPerformanceMetricsParams = {
  /**
   * 用户ID
   */
  userId?: number;
  /**
   * 页面URL
   */
  pageUrl?: string;
  /**
   * 开始时间
   */
  startTime?: string;
  /**
   * 结束时间
   */
  endTime?: string;
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页数量
   */
  pageSize?: number;
};
