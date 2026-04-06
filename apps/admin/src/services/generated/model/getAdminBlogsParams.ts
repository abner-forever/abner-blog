import type { GetAdminBlogsSortOrder } from "./getAdminBlogsSortOrder";

export type GetAdminBlogsParams = {
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页数量
   */
  size?: number;
  /**
   * 搜索关键词
   */
  keyword?: string;
  /**
   * 是否已发布
   */
  isPublished?: boolean;
  /**
   * 排序：latest, oldest, popular, unpopular, most-liked, least-liked, most-commented, least-commented
   */
  sort?: string;
  /**
   * 排序字段
   */
  sortBy?: string;
  /**
   * 排序方向
   */
  sortOrder?: GetAdminBlogsSortOrder;
};
