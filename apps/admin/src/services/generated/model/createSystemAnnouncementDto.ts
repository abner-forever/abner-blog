export interface CreateSystemAnnouncementDto {
  /** 标题 */
  title: string;
  /** 富文本 HTML（服务端会消毒） */
  bodyRich: string;
  /** 配图 URL 列表 */
  imageUrls?: string[];
  /** 排序权重，越大越靠前 */
  sortOrder?: number;
}
