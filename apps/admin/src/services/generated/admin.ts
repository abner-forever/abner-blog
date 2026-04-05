import type {
  AdminAuthControllerInitAdmin201,
  AdminBlogsControllerGetBlogsParams,
  AdminCommentsControllerGetBlogCommentsParams,
  AdminCommentsControllerGetCommentsParams,
  AdminCommentsControllerGetTopicCommentsParams,
  AdminCreateTopicDto,
  AdminDashboardControllerGetDailyViewsParams,
  AdminLoginDto,
  AdminMomentsControllerGetMomentsParams,
  AdminSystemAnnouncementsControllerGetSystemAnnouncementsParams,
  AdminTopicsControllerGetTopicsParams,
  AdminUpdateBlogDto,
  AdminUsersControllerGetUsersParams,
  BatchDeleteCommentsDto,
  Blog,
  CreateSystemAnnouncementDto,
  CreateUserDto,
  DailyViewItemDto,
  Moment,
  SystemAnnouncement,
  ToggleBlogPublishDto,
  Topic,
  UpdateMomentDto,
  UpdateSystemAnnouncementDto,
  UpdateTopicDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  User,
} from "./model";

import { httpMutator } from "../http";
export const getBlogAdminAPI = () => {
  /**
   * @summary 初始化管理员
   */
  const adminAuthControllerInitAdmin = () => {
    return httpMutator<AdminAuthControllerInitAdmin201>({
      url: `/api/admin/init-admin`,
      method: "POST",
    });
  };

  const adminAuthControllerLogin = (adminLoginDto: AdminLoginDto) => {
    return httpMutator<void>({
      url: `/api/admin/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: adminLoginDto,
    });
  };

  const adminAuthControllerGetProfile = () => {
    return httpMutator<void>({ url: `/api/admin/auth/profile`, method: "GET" });
  };

  const adminDashboardControllerGetDashboardStats = () => {
    return httpMutator<void>({
      url: `/api/admin/dashboard/stats`,
      method: "GET",
    });
  };

  const adminDashboardControllerGetMomentsStats = () => {
    return httpMutator<void>({
      url: `/api/admin/dashboard/moments-stats`,
      method: "GET",
    });
  };

  /**
   * @summary 每日访问量
   */
  const adminDashboardControllerGetDailyViews = (
    params?: AdminDashboardControllerGetDailyViewsParams,
  ) => {
    return httpMutator<DailyViewItemDto[]>({
      url: `/api/admin/dashboard/daily-views`,
      method: "GET",
      params,
    });
  };

  const adminTopicsControllerGetTopics = (
    params?: AdminTopicsControllerGetTopicsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/topics`,
      method: "GET",
      params,
    });
  };

  const adminTopicsControllerCreateTopic = (
    adminCreateTopicDto: AdminCreateTopicDto,
  ) => {
    return httpMutator<Topic>({
      url: `/api/admin/topics`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: adminCreateTopicDto,
    });
  };

  const adminTopicsControllerUpdateTopic = (
    id: number,
    updateTopicDto: UpdateTopicDto,
  ) => {
    return httpMutator<Topic>({
      url: `/api/admin/topics/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateTopicDto,
    });
  };

  const adminTopicsControllerDeleteTopic = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/topics/${id}`,
      method: "DELETE",
    });
  };

  const adminCommentsControllerGetBlogComments = (
    params?: AdminCommentsControllerGetBlogCommentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/blog`,
      method: "GET",
      params,
    });
  };

  const adminCommentsControllerGetTopicComments = (
    params?: AdminCommentsControllerGetTopicCommentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/topic`,
      method: "GET",
      params,
    });
  };

  const adminCommentsControllerGetComments = (
    params?: AdminCommentsControllerGetCommentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments`,
      method: "GET",
      params,
    });
  };

  const adminCommentsControllerDeleteComment = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/comments/${id}`,
      method: "DELETE",
    });
  };

  const adminCommentsControllerBatchDeleteComments = (
    batchDeleteCommentsDto: BatchDeleteCommentsDto,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/batch-delete`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: batchDeleteCommentsDto,
    });
  };

  const adminUsersControllerGetUsers = (
    params?: AdminUsersControllerGetUsersParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/users`,
      method: "GET",
      params,
    });
  };

  const adminUsersControllerCreateUser = (createUserDto: CreateUserDto) => {
    return httpMutator<User>({
      url: `/api/admin/users`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createUserDto,
    });
  };

  const adminUsersControllerGetUserById = (id: number) => {
    return httpMutator<User>({ url: `/api/admin/users/${id}`, method: "GET" });
  };

  const adminUsersControllerUpdateUser = (
    id: number,
    updateUserDto: UpdateUserDto,
  ) => {
    return httpMutator<User>({
      url: `/api/admin/users/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateUserDto,
    });
  };

  const adminUsersControllerDeleteUser = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/users/${id}`,
      method: "DELETE",
    });
  };

  const adminUsersControllerUpdateUserStatus = (
    id: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ) => {
    return httpMutator<User>({
      url: `/api/admin/users/${id}/status`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateUserStatusDto,
    });
  };

  const adminBlogsControllerGetBlogs = (
    params?: AdminBlogsControllerGetBlogsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/blogs`,
      method: "GET",
      params,
    });
  };

  const adminBlogsControllerGetBlogById = (id: number) => {
    return httpMutator<Blog>({ url: `/api/admin/blogs/${id}`, method: "GET" });
  };

  const adminBlogsControllerUpdateBlog = (
    id: number,
    adminUpdateBlogDto: AdminUpdateBlogDto,
  ) => {
    return httpMutator<Blog>({
      url: `/api/admin/blogs/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: adminUpdateBlogDto,
    });
  };

  const adminBlogsControllerDeleteBlog = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/blogs/${id}`,
      method: "DELETE",
    });
  };

  const adminBlogsControllerToggleBlogPublish = (
    id: number,
    toggleBlogPublishDto: ToggleBlogPublishDto,
  ) => {
    return httpMutator<Blog>({
      url: `/api/admin/blogs/${id}/publish`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: toggleBlogPublishDto,
    });
  };

  const adminMomentsControllerGetMoments = (
    params?: AdminMomentsControllerGetMomentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/moments`,
      method: "GET",
      params,
    });
  };

  const adminMomentsControllerGetMomentById = (id: number) => {
    return httpMutator<Moment>({
      url: `/api/admin/moments/${id}`,
      method: "GET",
    });
  };

  const adminMomentsControllerUpdateMoment = (
    id: number,
    updateMomentDto: UpdateMomentDto,
  ) => {
    return httpMutator<Moment>({
      url: `/api/admin/moments/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateMomentDto,
    });
  };

  const adminMomentsControllerDeleteMoment = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/moments/${id}`,
      method: "DELETE",
    });
  };

  const adminSystemAnnouncementsControllerGetSystemAnnouncements = (
    params?: AdminSystemAnnouncementsControllerGetSystemAnnouncementsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements`,
      method: "GET",
      params,
    });
  };

  const adminSystemAnnouncementsControllerCreateSystemAnnouncement = (
    createSystemAnnouncementDto: CreateSystemAnnouncementDto,
  ) => {
    return httpMutator<SystemAnnouncement>({
      url: `/api/admin/system-announcements`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createSystemAnnouncementDto,
    });
  };

  const adminSystemAnnouncementsControllerGetSystemAnnouncementById = (
    id: number,
  ) => {
    return httpMutator<SystemAnnouncement>({
      url: `/api/admin/system-announcements/${id}`,
      method: "GET",
    });
  };

  const adminSystemAnnouncementsControllerUpdateSystemAnnouncement = (
    id: number,
    updateSystemAnnouncementDto: UpdateSystemAnnouncementDto,
  ) => {
    return httpMutator<SystemAnnouncement>({
      url: `/api/admin/system-announcements/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateSystemAnnouncementDto,
    });
  };

  const adminSystemAnnouncementsControllerDeleteSystemAnnouncement = (
    id: number,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}`,
      method: "DELETE",
    });
  };

  const adminSystemAnnouncementsControllerPublishSystemAnnouncement = (
    id: number,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/publish`,
      method: "POST",
    });
  };

  const adminSystemAnnouncementsControllerRecallSystemAnnouncement = (
    id: number,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/recall`,
      method: "POST",
    });
  };

  const adminSystemAnnouncementsControllerSyncSystemAnnouncementNotifications =
    (id: number) => {
      return httpMutator<void>({
        url: `/api/admin/system-announcements/${id}/sync-notifications`,
        method: "POST",
      });
    };

  return {
    adminAuthControllerInitAdmin,
    adminAuthControllerLogin,
    adminAuthControllerGetProfile,
    adminDashboardControllerGetDashboardStats,
    adminDashboardControllerGetMomentsStats,
    adminDashboardControllerGetDailyViews,
    adminTopicsControllerGetTopics,
    adminTopicsControllerCreateTopic,
    adminTopicsControllerUpdateTopic,
    adminTopicsControllerDeleteTopic,
    adminCommentsControllerGetBlogComments,
    adminCommentsControllerGetTopicComments,
    adminCommentsControllerGetComments,
    adminCommentsControllerDeleteComment,
    adminCommentsControllerBatchDeleteComments,
    adminUsersControllerGetUsers,
    adminUsersControllerCreateUser,
    adminUsersControllerGetUserById,
    adminUsersControllerUpdateUser,
    adminUsersControllerDeleteUser,
    adminUsersControllerUpdateUserStatus,
    adminBlogsControllerGetBlogs,
    adminBlogsControllerGetBlogById,
    adminBlogsControllerUpdateBlog,
    adminBlogsControllerDeleteBlog,
    adminBlogsControllerToggleBlogPublish,
    adminMomentsControllerGetMoments,
    adminMomentsControllerGetMomentById,
    adminMomentsControllerUpdateMoment,
    adminMomentsControllerDeleteMoment,
    adminSystemAnnouncementsControllerGetSystemAnnouncements,
    adminSystemAnnouncementsControllerCreateSystemAnnouncement,
    adminSystemAnnouncementsControllerGetSystemAnnouncementById,
    adminSystemAnnouncementsControllerUpdateSystemAnnouncement,
    adminSystemAnnouncementsControllerDeleteSystemAnnouncement,
    adminSystemAnnouncementsControllerPublishSystemAnnouncement,
    adminSystemAnnouncementsControllerRecallSystemAnnouncement,
    adminSystemAnnouncementsControllerSyncSystemAnnouncementNotifications,
  };
};
export type AdminAuthControllerInitAdminResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminAuthControllerInitAdmin"]
    >
  >
>;
export type AdminAuthControllerLoginResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAdminAPI>["adminAuthControllerLogin"]>
  >
>;
export type AdminAuthControllerGetProfileResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminAuthControllerGetProfile"]
    >
  >
>;
export type AdminDashboardControllerGetDashboardStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminDashboardControllerGetDashboardStats"]
    >
  >
>;
export type AdminDashboardControllerGetMomentsStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminDashboardControllerGetMomentsStats"]
    >
  >
>;
export type AdminDashboardControllerGetDailyViewsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminDashboardControllerGetDailyViews"]
    >
  >
>;
export type AdminTopicsControllerGetTopicsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminTopicsControllerGetTopics"]
    >
  >
>;
export type AdminTopicsControllerCreateTopicResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminTopicsControllerCreateTopic"]
    >
  >
>;
export type AdminTopicsControllerUpdateTopicResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminTopicsControllerUpdateTopic"]
    >
  >
>;
export type AdminTopicsControllerDeleteTopicResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminTopicsControllerDeleteTopic"]
    >
  >
>;
export type AdminCommentsControllerGetBlogCommentsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminCommentsControllerGetBlogComments"]
    >
  >
>;
export type AdminCommentsControllerGetTopicCommentsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminCommentsControllerGetTopicComments"]
    >
  >
>;
export type AdminCommentsControllerGetCommentsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminCommentsControllerGetComments"]
    >
  >
>;
export type AdminCommentsControllerDeleteCommentResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminCommentsControllerDeleteComment"]
    >
  >
>;
export type AdminCommentsControllerBatchDeleteCommentsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminCommentsControllerBatchDeleteComments"]
    >
  >
>;
export type AdminUsersControllerGetUsersResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminUsersControllerGetUsers"]
    >
  >
>;
export type AdminUsersControllerCreateUserResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminUsersControllerCreateUser"]
    >
  >
>;
export type AdminUsersControllerGetUserByIdResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminUsersControllerGetUserById"]
    >
  >
>;
export type AdminUsersControllerUpdateUserResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminUsersControllerUpdateUser"]
    >
  >
>;
export type AdminUsersControllerDeleteUserResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminUsersControllerDeleteUser"]
    >
  >
>;
export type AdminUsersControllerUpdateUserStatusResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminUsersControllerUpdateUserStatus"]
    >
  >
>;
export type AdminBlogsControllerGetBlogsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminBlogsControllerGetBlogs"]
    >
  >
>;
export type AdminBlogsControllerGetBlogByIdResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminBlogsControllerGetBlogById"]
    >
  >
>;
export type AdminBlogsControllerUpdateBlogResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminBlogsControllerUpdateBlog"]
    >
  >
>;
export type AdminBlogsControllerDeleteBlogResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminBlogsControllerDeleteBlog"]
    >
  >
>;
export type AdminBlogsControllerToggleBlogPublishResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAdminAPI
      >["adminBlogsControllerToggleBlogPublish"]
    >
  >
>;
export type AdminMomentsControllerGetMomentsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminMomentsControllerGetMoments"]
    >
  >
>;
export type AdminMomentsControllerGetMomentByIdResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminMomentsControllerGetMomentById"]
    >
  >
>;
export type AdminMomentsControllerUpdateMomentResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminMomentsControllerUpdateMoment"]
    >
  >
>;
export type AdminMomentsControllerDeleteMomentResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAdminAPI>["adminMomentsControllerDeleteMoment"]
    >
  >
>;
export type AdminSystemAnnouncementsControllerGetSystemAnnouncementsResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerGetSystemAnnouncements"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerCreateSystemAnnouncementResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerCreateSystemAnnouncement"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerGetSystemAnnouncementByIdResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerGetSystemAnnouncementById"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerUpdateSystemAnnouncementResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerUpdateSystemAnnouncement"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerDeleteSystemAnnouncementResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerDeleteSystemAnnouncement"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerPublishSystemAnnouncementResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerPublishSystemAnnouncement"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerRecallSystemAnnouncementResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerRecallSystemAnnouncement"]
      >
    >
  >;
export type AdminSystemAnnouncementsControllerSyncSystemAnnouncementNotificationsResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAdminAPI
        >["adminSystemAnnouncementsControllerSyncSystemAnnouncementNotifications"]
      >
    >
  >;
