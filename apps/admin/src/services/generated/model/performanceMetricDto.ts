export interface PerformanceMetricDto {
  /** 最大内容绘制 (ms) */
  lcp?: number;
  /** 首次输入延迟 (ms) */
  fid?: number;
  /** 累积布局偏移 */
  cls?: number;
  /** 首次内容绘制 (ms) */
  fcp?: number;
  /** 首字节时间 (ms) */
  ttfb?: number;
  /** 输入延迟 (ms) */
  inputDelay?: number;
  /** 导航类型 */
  navigationType?: string;
  /** 连接类型 */
  connectionType?: string;
  /** 设备像素比 */
  devicePixelRatio?: number;
  /** 视口大小 */
  viewportSize?: string;
}
