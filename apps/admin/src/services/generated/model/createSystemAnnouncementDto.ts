export interface CreateSystemAnnouncementDto {
  /**
   * 标题
   * @maxLength 200
   */
  title: string;
  /**
   * 富文本 HTML（服务端会消毒）
   * @maxLength 100000
   */
  bodyRich: string;
  /** 配图 URL 列表 */
  imageUrls?: string[];
  /** 排序权重，越大越靠前 */
  sortOrder?: number;
}
