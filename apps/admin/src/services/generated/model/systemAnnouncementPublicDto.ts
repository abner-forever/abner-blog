export interface SystemAnnouncementPublicDto {
  /** 公告 ID */
  id: number;
  /** 标题 */
  title: string;
  /** 是否已被管理端撤回（为 true 时不展示正文） */
  recalled?: boolean;
  /** 推送版本号（>1 表示曾重新推送） */
  notifyRevision?: number;
  /** 正文 HTML（已消毒）；撤回时为空字符串 */
  bodyRich: string;
  /** 配图 URL 列表 */
  imageUrls: string[];
  /**
   * 发布时间
   * @nullable
   */
  publishedAt: string | null;
  /** 创建时间 */
  createdAt: string;
}
