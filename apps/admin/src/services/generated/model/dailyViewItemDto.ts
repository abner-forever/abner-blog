export interface DailyViewItemDto {
  /** 日期，格式 YYYY-MM-DD */
  date: string;
  /** PV（页面浏览量） */
  pv?: number;
  /** UV（独立访客） */
  uv?: number;
  /** 访问量（当 type=pv 或 type=uv 时返回此字段） */
  views?: number;
}
