export type GetAdminBlogCommentsParams = {
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页数量
   */
  size?: number;
  /**
   * 博客 ID
   */
  blogId?: number;
  /**
   * 话题 ID
   */
  topicId?: number;
  /**
   * 搜索关键词
   */
  keyword?: string;
};
