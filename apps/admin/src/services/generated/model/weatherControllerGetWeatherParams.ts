export type WeatherControllerGetWeatherParams = {
  /**
   * 城市名称，如北京、上海
   */
  city?: string;
  /**
   * 目标日期（YYYY-MM-DD），默认当天
   */
  date?: string;
};
