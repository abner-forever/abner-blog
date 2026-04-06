import type { GetAdminMomentsSortBy } from "./getAdminMomentsSortBy";

export type GetAdminMomentsParams = {
  /**
   * 页码
   * @minimum 1
   */
  page?: number;
  /**
   * 每页数量
   * @minimum 1
   */
  pageSize?: number;
  /**
   * 搜索关键词
   */
  search?: string;
  /**
   * 话题 ID 筛选
   */
  topicId?: number;
  /**
   * 排序方式：time（最新）/ hot（最热）
   */
  sortBy?: GetAdminMomentsSortBy;
  keyword?: string;
  size?: number;
};
