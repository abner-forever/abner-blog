export interface SystemAnnouncement {
  id: number;
  title: string;
  bodyRich: string;
  /** @nullable */
  imageUrls: string[] | null;
  published: boolean;
  /** @nullable */
  publishedAt: string | null;
  /**
   * 管理端撤回后 C 端仅展示「已撤回」，不再展示正文
   * @nullable
   */
  recalledAt: string | null;
  /** 推送到用户通知中心的版本号，首次发布为 1，每次「重新推送」递增。
用于 C 端提示内容有更新。 */
  notifyRevision: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
