import type {
  AdminCreateTopicDto,
  AdminLoginDto,
  AdminUpdateBlogDto,
  AllCommentListResponse,
  AnalyticsControllerGetClickEventStatsParams,
  AnalyticsControllerGetEventTrendParams,
  AnalyticsControllerGetOverviewParams,
  AnalyticsControllerGetPageViewStatsParams,
  AnalyticsControllerGetPerformanceMetricsParams,
  AnalyticsControllerGetPerformanceStatsParams,
  AnalyticsControllerGetPopularPagesParams,
  AnalyticsControllerGetTopPagesParams,
  AnalyticsControllerGetTrackEventStatsParams,
  AnalyticsControllerGetTrackEventsParams,
  AnalyticsControllerGetUserBehaviorDetailParams,
  AnalyticsControllerGetUserListParams,
  AuthTokenResponseDto,
  BatchDeleteCommentsDto,
  BlogCommentListResponse,
  BlogDto,
  BlogListResponseDto,
  CreateSystemAnnouncementDto,
  CreateUserDto,
  DailyViewItemDto,
  GetAdminBlogCommentsParams,
  GetAdminBlogsParams,
  GetAdminCommentsParams,
  GetAdminDailyViewsParams,
  GetAdminMomentsParams,
  GetAdminSystemAnnouncementsParams,
  GetAdminTopicCommentsParams,
  GetAdminTopicsParams,
  GetAdminUsersParams,
  MomentDto,
  MomentListResponse,
  PerformanceMetricDto,
  ToggleBlogPublishDto,
  TopicCommentListResponse,
  TopicDto,
  TopicListResponse,
  TrackEventBatchDto,
  TrackEventDto,
  UpdateMomentDto,
  UpdateSystemAnnouncementDto,
  UpdateTopicDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserProfileDto,
} from "./model";

import { httpMutator } from "../http";
export const getBlogAdminAPI = () => {
  /**
   * @summary 初始化管理员（首次调用创建默认管理员）
   */
  const initAdmin = () => {
    return httpMutator<void>({ url: `/api/admin/init-admin`, method: "POST" });
  };

  /**
   * @summary 管理员登录
   */
  const adminLogin = (adminLoginDto: AdminLoginDto) => {
    return httpMutator<AuthTokenResponseDto>({
      url: `/api/admin/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: adminLoginDto,
    });
  };

  /**
   * @summary 获取当前管理员信息
   */
  const getAdminProfile = () => {
    return httpMutator<AuthTokenResponseDto>({
      url: `/api/admin/auth/profile`,
      method: "GET",
    });
  };

  /**
   * @summary 获取仪表盘统计数据
   */
  const getAdminDashboardStats = () => {
    return httpMutator<void>({
      url: `/api/admin/dashboard/stats`,
      method: "GET",
    });
  };

  /**
   * @summary 获取动态统计数据
   */
  const getAdminMomentsStats = () => {
    return httpMutator<void>({
      url: `/api/admin/dashboard/moments-stats`,
      method: "GET",
    });
  };

  /**
   * @summary 每日访问量
   */
  const getAdminDailyViews = (params?: GetAdminDailyViewsParams) => {
    return httpMutator<DailyViewItemDto[]>({
      url: `/api/admin/dashboard/daily-views`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取话题列表
   */
  const getAdminTopics = (params?: GetAdminTopicsParams) => {
    return httpMutator<TopicListResponse>({
      url: `/api/admin/topics`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 创建话题
   */
  const createAdminTopic = (adminCreateTopicDto: AdminCreateTopicDto) => {
    return httpMutator<TopicDto>({
      url: `/api/admin/topics`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: adminCreateTopicDto,
    });
  };

  /**
   * @summary 更新话题
   */
  const updateAdminTopic = (id: number, updateTopicDto: UpdateTopicDto) => {
    return httpMutator<TopicDto>({
      url: `/api/admin/topics/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateTopicDto,
    });
  };

  /**
   * @summary 删除话题
   */
  const deleteAdminTopic = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/topics/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 获取博客评论列表（管理端）
   */
  const getAdminBlogComments = (params?: GetAdminBlogCommentsParams) => {
    return httpMutator<BlogCommentListResponse>({
      url: `/api/admin/comments/blog`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取话题评论列表（管理端）
   */
  const getAdminTopicComments = (params?: GetAdminTopicCommentsParams) => {
    return httpMutator<TopicCommentListResponse>({
      url: `/api/admin/comments/topic`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取全部评论列表（管理端）
   */
  const getAdminComments = (params?: GetAdminCommentsParams) => {
    return httpMutator<AllCommentListResponse>({
      url: `/api/admin/comments`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 删除评论
   */
  const deleteAdminComment = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/comments/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 批量删除评论
   */
  const batchDeleteAdminComments = (
    batchDeleteCommentsDto: BatchDeleteCommentsDto,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/batch-delete`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: batchDeleteCommentsDto,
    });
  };

  /**
   * @summary 获取用户列表（管理端）
   */
  const getAdminUsers = (params?: GetAdminUsersParams) => {
    return httpMutator<UserProfileDto[]>({
      url: `/api/admin/users`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 创建用户
   */
  const createAdminUser = (createUserDto: CreateUserDto) => {
    return httpMutator<UserProfileDto>({
      url: `/api/admin/users`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createUserDto,
    });
  };

  /**
   * @summary 获取用户详情（管理端）
   */
  const getAdminUserById = (id: number) => {
    return httpMutator<UserProfileDto>({
      url: `/api/admin/users/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新用户
   */
  const updateAdminUser = (id: number, updateUserDto: UpdateUserDto) => {
    return httpMutator<UserProfileDto>({
      url: `/api/admin/users/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateUserDto,
    });
  };

  /**
   * @summary 删除用户
   */
  const deleteAdminUser = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/users/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 更新用户状态
   */
  const updateAdminUserStatus = (
    id: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ) => {
    return httpMutator<UserProfileDto>({
      url: `/api/admin/users/${id}/status`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateUserStatusDto,
    });
  };

  /**
   * @summary 获取博客列表（管理端）
   */
  const getAdminBlogs = (params?: GetAdminBlogsParams) => {
    return httpMutator<BlogListResponseDto>({
      url: `/api/admin/blogs`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取博客详情（管理端）
   */
  const getAdminBlogById = (id: number) => {
    return httpMutator<BlogDto>({
      url: `/api/admin/blogs/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新博客
   */
  const updateAdminBlog = (
    id: number,
    adminUpdateBlogDto: AdminUpdateBlogDto,
  ) => {
    return httpMutator<BlogDto>({
      url: `/api/admin/blogs/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: adminUpdateBlogDto,
    });
  };

  /**
   * @summary 删除博客
   */
  const deleteAdminBlog = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/blogs/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 切换博客发布状态
   */
  const toggleAdminBlogPublish = (
    id: number,
    toggleBlogPublishDto: ToggleBlogPublishDto,
  ) => {
    return httpMutator<BlogDto>({
      url: `/api/admin/blogs/${id}/publish`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: toggleBlogPublishDto,
    });
  };

  /**
   * @summary 获取动态列表
   */
  const getAdminMoments = (params?: GetAdminMomentsParams) => {
    return httpMutator<MomentListResponse>({
      url: `/api/admin/moments`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取动态详情
   */
  const getAdminMomentById = (id: number) => {
    return httpMutator<MomentDto>({
      url: `/api/admin/moments/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新动态
   */
  const updateAdminMoment = (id: number, updateMomentDto: UpdateMomentDto) => {
    return httpMutator<MomentDto>({
      url: `/api/admin/moments/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateMomentDto,
    });
  };

  /**
   * @summary 删除动态
   */
  const deleteAdminMoment = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/moments/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 获取系统公告列表
   */
  const getAdminSystemAnnouncements = (
    params?: GetAdminSystemAnnouncementsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 创建系统公告
   */
  const createAdminSystemAnnouncement = (
    createSystemAnnouncementDto: CreateSystemAnnouncementDto,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createSystemAnnouncementDto,
    });
  };

  /**
   * @summary 获取系统公告详情
   */
  const getAdminSystemAnnouncementById = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新系统公告
   */
  const updateAdminSystemAnnouncement = (
    id: number,
    updateSystemAnnouncementDto: UpdateSystemAnnouncementDto,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateSystemAnnouncementDto,
    });
  };

  /**
   * @summary 删除系统公告
   */
  const deleteAdminSystemAnnouncement = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 发布系统公告
   */
  const publishAdminSystemAnnouncement = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/publish`,
      method: "POST",
    });
  };

  /**
   * @summary 撤回系统公告
   */
  const recallAdminSystemAnnouncement = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/recall`,
      method: "POST",
    });
  };

  /**
   * @summary 同步系统公告通知
   */
  const syncAdminSystemAnnouncementNotifications = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/sync-notifications`,
      method: "POST",
    });
  };

  /**
   * @summary 上报埋点事件
   */
  const analyticsControllerTrack = (trackEventDto: TrackEventDto) => {
    return httpMutator<void>({
      url: `/api/analytics/track`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: trackEventDto,
    });
  };

  /**
   * @summary 批量上报埋点事件
   */
  const analyticsControllerTrackBatch = (
    trackEventBatchDto: TrackEventBatchDto,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/track/batch`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: trackEventBatchDto,
    });
  };

  /**
   * @summary 上报性能数据
   */
  const analyticsControllerPerformance = (
    performanceMetricDto: PerformanceMetricDto,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/performance`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: performanceMetricDto,
    });
  };

  /**
   * @summary 查询性能数据列表
   */
  const analyticsControllerGetPerformanceMetrics = (
    params?: AnalyticsControllerGetPerformanceMetricsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/performance`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 查询埋点事件列表
   */
  const analyticsControllerGetTrackEvents = (
    params?: AnalyticsControllerGetTrackEventsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/events`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取埋点事件统计
   */
  const analyticsControllerGetTrackEventStats = (
    params: AnalyticsControllerGetTrackEventStatsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/events/stats`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取性能数据统计
   */
  const analyticsControllerGetPerformanceStats = (
    params: AnalyticsControllerGetPerformanceStatsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/performance/stats`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取性能最差的页面
   */
  const analyticsControllerGetTopPages = (
    params: AnalyticsControllerGetTopPagesParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/performance/top-pages`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取埋点概览统计
   */
  const analyticsControllerGetOverview = (
    params: AnalyticsControllerGetOverviewParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/overview`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取事件趋势
   */
  const analyticsControllerGetEventTrend = (
    params: AnalyticsControllerGetEventTrendParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/trend`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取用户列表
   */
  const analyticsControllerGetUserList = (
    params: AnalyticsControllerGetUserListParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/users`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取用户行为详情
   */
  const analyticsControllerGetUserBehaviorDetail = (
    anonymousId: string,
    params: AnalyticsControllerGetUserBehaviorDetailParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/users/${anonymousId}`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取页面访问统计
   */
  const analyticsControllerGetPageViewStats = (
    params: AnalyticsControllerGetPageViewStatsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/pageviews`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取点击事件统计
   */
  const analyticsControllerGetClickEventStats = (
    params: AnalyticsControllerGetClickEventStatsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/clicks`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取热门页面排行
   */
  const analyticsControllerGetPopularPages = (
    params: AnalyticsControllerGetPopularPagesParams,
  ) => {
    return httpMutator<void>({
      url: `/api/analytics/popular-pages`,
      method: "GET",
      params,
    });
  };

  return {
    initAdmin,
    adminLogin,
    getAdminProfile,
    getAdminDashboardStats,
    getAdminMomentsStats,
    getAdminDailyViews,
    getAdminTopics,
    createAdminTopic,
    updateAdminTopic,
    deleteAdminTopic,
    getAdminBlogComments,
    getAdminTopicComments,
    getAdminComments,
    deleteAdminComment,
    batchDeleteAdminComments,
    getAdminUsers,
    createAdminUser,
    getAdminUserById,
    updateAdminUser,
    deleteAdminUser,
    updateAdminUserStatus,
    getAdminBlogs,
    getAdminBlogById,
    updateAdminBlog,
    deleteAdminBlog,
    toggleAdminBlogPublish,
    getAdminMoments,
    getAdminMomentById,
    updateAdminMoment,
    deleteAdminMoment,
    getAdminSystemAnnouncements,
    createAdminSystemAnnouncement,
    getAdminSystemAnnouncementById,
    updateAdminSystemAnnouncement,
    deleteAdminSystemAnnouncement,
    publishAdminSystemAnnouncement,
    recallAdminSystemAnnouncement,
    syncAdminSystemAnnouncementNotifications,
    analyticsControllerTrack,
    analyticsControllerTrackBatch,
    analyticsControllerPerformance,
    analyticsControllerGetPerformanceMetrics,
    analyticsControllerGetTrackEvents,
    analyticsControllerGetTrackEventStats,
    analyticsControllerGetPerformanceStats,
    analyticsControllerGetTopPages,
    analyticsControllerGetOverview,
    analyticsControllerGetEventTrend,
    analyticsControllerGetUserList,
    analyticsControllerGetUserBehaviorDetail,
    analyticsControllerGetPageViewStats,
    analyticsControllerGetClickEventStats,
    analyticsControllerGetPopularPages,
  };
};
export type InitAdminResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["initAdmin"]>>
>;
export type AdminLoginResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["adminLogin"]>>
>;
export type GetAdminProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminProfile"]>>
>;
export type GetAdminDashboardStatsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminDashboardStats"]>
  >
>;
export type GetAdminMomentsStatsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminMomentsStats"]>
  >
>;
export type GetAdminDailyViewsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminDailyViews"]>>
>;
export type GetAdminTopicsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminTopics"]>>
>;
export type CreateAdminTopicResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["createAdminTopic"]>>
>;
export type UpdateAdminTopicResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["updateAdminTopic"]>>
>;
export type DeleteAdminTopicResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["deleteAdminTopic"]>>
>;
export type GetAdminBlogCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminBlogComments"]>
  >
>;
export type GetAdminTopicCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminTopicComments"]>
  >
>;
export type GetAdminCommentsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminComments"]>>
>;
export type DeleteAdminCommentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["deleteAdminComment"]>>
>;
export type BatchDeleteAdminCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["batchDeleteAdminComments"]>
  >
>;
export type GetAdminUsersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminUsers"]>>
>;
export type CreateAdminUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["createAdminUser"]>>
>;
export type GetAdminUserByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminUserById"]>>
>;
export type UpdateAdminUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["updateAdminUser"]>>
>;
export type DeleteAdminUserResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["deleteAdminUser"]>>
>;
export type UpdateAdminUserStatusResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["updateAdminUserStatus"]>
  >
>;
export type GetAdminBlogsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminBlogs"]>>
>;
export type GetAdminBlogByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminBlogById"]>>
>;
export type UpdateAdminBlogResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["updateAdminBlog"]>>
>;
export type DeleteAdminBlogResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["deleteAdminBlog"]>>
>;
export type ToggleAdminBlogPublishResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["toggleAdminBlogPublish"]>
  >
>;
export type GetAdminMomentsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminMoments"]>>
>;
export type GetAdminMomentByIdResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["getAdminMomentById"]>>
>;
export type UpdateAdminMomentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["updateAdminMoment"]>>
>;
export type DeleteAdminMomentResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAdminAPI>["deleteAdminMoment"]>>
>;
export type GetAdminSystemAnnouncementsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["getAdminSystemAnnouncements"]
    >
  >
>;
export type CreateAdminSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["createAdminSystemAnnouncement"]
    >
  >
>;
export type GetAdminSystemAnnouncementByIdResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["getAdminSystemAnnouncementById"]
    >
  >
>;
export type UpdateAdminSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["updateAdminSystemAnnouncement"]
    >
  >
>;
export type DeleteAdminSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["deleteAdminSystemAnnouncement"]
    >
  >
>;
export type PublishAdminSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["publishAdminSystemAnnouncement"]
    >
  >
>;
export type RecallAdminSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["recallAdminSystemAnnouncement"]
    >
  >
>;
export type SyncAdminSystemAnnouncementNotificationsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["syncAdminSystemAnnouncementNotifications"]
    >
  >
>;
export type AnalyticsControllerTrackResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["analyticsControllerTrack"]>
  >
>;
export type AnalyticsControllerTrackBatchResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerTrackBatch"]
    >
  >
>;
export type AnalyticsControllerPerformanceResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerPerformance"]
    >
  >
>;
export type AnalyticsControllerGetPerformanceMetricsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["analyticsControllerGetPerformanceMetrics"]
    >
  >
>;
export type AnalyticsControllerGetTrackEventsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetTrackEvents"]
    >
  >
>;
export type AnalyticsControllerGetTrackEventStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["analyticsControllerGetTrackEventStats"]
    >
  >
>;
export type AnalyticsControllerGetPerformanceStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["analyticsControllerGetPerformanceStats"]
    >
  >
>;
export type AnalyticsControllerGetTopPagesResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetTopPages"]
    >
  >
>;
export type AnalyticsControllerGetOverviewResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetOverview"]
    >
  >
>;
export type AnalyticsControllerGetEventTrendResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetEventTrend"]
    >
  >
>;
export type AnalyticsControllerGetUserListResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetUserList"]
    >
  >
>;
export type AnalyticsControllerGetUserBehaviorDetailResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["analyticsControllerGetUserBehaviorDetail"]
    >
  >
>;
export type AnalyticsControllerGetPageViewStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetPageViewStats"]
    >
  >
>;
export type AnalyticsControllerGetClickEventStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["analyticsControllerGetClickEventStats"]
    >
  >
>;
export type AnalyticsControllerGetPopularPagesResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["analyticsControllerGetPopularPages"]
    >
  >
>;
