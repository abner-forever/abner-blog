import type {
  AddNoteToCollectionDto,
  AdminControllerGetBlogCommentsParams,
  AdminControllerGetBlogsParams,
  AdminControllerGetCommentsParams,
  AdminControllerGetDailyViewsParams,
  AdminControllerGetMomentsParams,
  AdminControllerGetSystemAnnouncementsParams,
  AdminControllerGetTopicCommentsParams,
  AdminControllerGetTopicsParams,
  AdminControllerGetUsersParams,
  AdminControllerInitAdmin201,
  AdminCreateTopicDto,
  AdminLoginDto,
  AdminUpdateBlogDto,
  AuthTokenResponseDto,
  BatchDeleteCommentsDto,
  Blog,
  BlogDto,
  BlogListResponseDto,
  BlogsControllerFindAllParams,
  BlogsControllerTogglePublish200,
  CalendarControllerFindAllParams,
  CalendarEventDto,
  CaptchaConfigResponseDto,
  ChatRequestDto,
  ChatResponseDto,
  Comment,
  CommentDto,
  ConversationsControllerListParams,
  ConversationsControllerMessagesParams,
  CreateBlogDto,
  CreateCalendarEventDto,
  CreateCommentDto,
  CreateMomentCommentDto,
  CreateMomentDto,
  CreateNoteCollectionDto,
  CreateNoteCommentDto,
  CreateNoteDto,
  CreateSystemAnnouncementDto,
  CreateTodoDto,
  CreateTopicDto,
  CreateUserDto,
  DailyViewItemDto,
  FollowsControllerFollowersParams,
  FollowsControllerFollowingParams,
  HotsearchControllerGetBilibiliHot200Item,
  HotsearchControllerGetGitHubHot200Item,
  HotsearchControllerGetHotSearch200,
  HotsearchControllerGetHotSearchParams,
  HotsearchControllerGetWeiboHot200Item,
  HotsearchControllerRefreshCache200,
  InitChunkUploadDto,
  LoginByCodeDto,
  LoginDto,
  MarkDmReadThroughDto,
  MarkNotificationsReadDto,
  MergeUploadDto,
  Moment,
  MomentDto,
  MomentListResponseDto,
  MomentsControllerFindAllParams,
  MomentsControllerGetFavorites200Item,
  NoteCollection,
  NotesControllerFindAllParams,
  NotesControllerGetFavorites200Item,
  NotificationsControllerListParams,
  OpenConversationDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  SaveAIConfigDto,
  SendCodeDto,
  SendDirectMessageDto,
  SystemAnnouncement,
  SystemAnnouncementPublicDto,
  TodoDto,
  TodoListResponseDto,
  ToggleBlogPublishDto,
  ToggleCommentLikeResponseDto,
  ToggleFavoriteResponseDto,
  ToggleLikeResponseDto,
  ToggleMomentFavoriteResponseDto,
  ToggleMomentLikeResponseDto,
  Topic,
  TopicsControllerFindOneParams,
  UpdateBlogDto,
  UpdateCalendarEventDto,
  UpdateCommentDto,
  UpdateMomentDto,
  UpdateProfileDto,
  UpdateResumeDto,
  UpdateSystemAnnouncementDto,
  UpdateTodoDto,
  UpdateTopicDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UploadControllerUploadChunkBody,
  UploadControllerUploadImageBody,
  UploadControllerUploadImageParams,
  UploadImageResponseDto,
  User,
  UserProfileDto,
  UserResumeDto,
  WeatherControllerGetWeather200,
  WeatherControllerGetWeatherParams,
} from "./model";

import { httpMutator } from "../http";
export const getBlogAPI = () => {
  /**
   * @summary 服务健康检查
   */
  const appControllerGetHello = () => {
    return httpMutator<string>({ url: `/api`, method: "GET" });
  };

  /**
   * @summary 获取站点统计数据
   */
  const appControllerGetStats = () => {
    return httpMutator<void>({ url: `/api/stats`, method: "GET" });
  };

  /**
   * @summary 跟踪页面访问
   */
  const appControllerTrackPageView = () => {
    return httpMutator<void>({ url: `/api/track/page-view`, method: "POST" });
  };

  /**
   * @summary 创建博客
   */
  const blogsControllerCreate = (createBlogDto: CreateBlogDto) => {
    return httpMutator<BlogDto>({
      url: `/api/blogs`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createBlogDto,
    });
  };

  /**
   * @summary 获取博客列表
   */
  const blogsControllerFindAll = (params?: BlogsControllerFindAllParams) => {
    return httpMutator<BlogListResponseDto>({
      url: `/api/blogs`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取推荐博客列表
   */
  const blogsControllerGetRecommended = () => {
    return httpMutator<BlogDto[]>({
      url: `/api/blogs/recommended`,
      method: "GET",
    });
  };

  /**
   * @summary 获取我的博客列表
   */
  const blogsControllerFindMyBlogs = () => {
    return httpMutator<BlogDto[]>({ url: `/api/blogs/my`, method: "GET" });
  };

  /**
   * @summary 获取博客详情
   */
  const blogsControllerFindOne = (id: string) => {
    return httpMutator<BlogDto>({ url: `/api/blogs/${id}`, method: "GET" });
  };

  /**
   * @summary 更新博客
   */
  const blogsControllerUpdate = (id: string, updateBlogDto: UpdateBlogDto) => {
    return httpMutator<BlogDto>({
      url: `/api/blogs/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateBlogDto,
    });
  };

  /**
   * @summary 删除博客
   */
  const blogsControllerRemove = (id: string) => {
    return httpMutator<void>({ url: `/api/blogs/${id}`, method: "DELETE" });
  };

  /**
   * @summary 切换博客发布状态
   */
  const blogsControllerTogglePublish = (id: string) => {
    return httpMutator<BlogsControllerTogglePublish200>({
      url: `/api/blogs/${id}/publish`,
      method: "PATCH",
    });
  };

  /**
   * @summary 获取用户公开信息
   */
  const usersControllerFindOne = (id: string) => {
    return httpMutator<UserProfileDto>({
      url: `/api/users/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新当前用户资料
   */
  const usersControllerUpdateProfile = (updateProfileDto: UpdateProfileDto) => {
    return httpMutator<UserProfileDto>({
      url: `/api/users/profile`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateProfileDto,
    });
  };

  /**
   * @summary 获取用户简历
   */
  const usersControllerGetResume = (id: string) => {
    return httpMutator<UserResumeDto>({
      url: `/api/users/${id}/resume`,
      method: "GET",
    });
  };

  /**
   * @summary 更新当前用户简历
   */
  const usersControllerUpdateResume = (updateResumeDto: UpdateResumeDto) => {
    return httpMutator<UserResumeDto>({
      url: `/api/users/resume`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateResumeDto,
    });
  };

  /**
   * @summary 关注用户
   */
  const followsControllerFollow = (id: number) => {
    return httpMutator<void>({
      url: `/api/users/${id}/follow`,
      method: "POST",
    });
  };

  /**
   * @summary 取消关注
   */
  const followsControllerUnfollow = (id: number) => {
    return httpMutator<void>({
      url: `/api/users/${id}/follow`,
      method: "DELETE",
    });
  };

  /**
   * @summary 粉丝列表
   */
  const followsControllerFollowers = (
    id: number,
    params?: FollowsControllerFollowersParams,
  ) => {
    return httpMutator<void>({
      url: `/api/users/${id}/followers`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 关注列表
   */
  const followsControllerFollowing = (
    id: number,
    params?: FollowsControllerFollowingParams,
  ) => {
    return httpMutator<void>({
      url: `/api/users/${id}/following`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 当前用户与该用户的关注状态
   */
  const followsControllerFollowStatus = (id: number) => {
    return httpMutator<void>({
      url: `/api/users/${id}/follow-status`,
      method: "GET",
    });
  };

  /**
   * @summary 私信未读消息条数
   */
  const conversationsControllerUnreadCount = () => {
    return httpMutator<void>({
      url: `/api/conversations/unread-count`,
      method: "GET",
    });
  };

  /**
   * @summary 我的私信会话列表
   */
  const conversationsControllerList = (
    params?: ConversationsControllerListParams,
  ) => {
    return httpMutator<void>({
      url: `/api/conversations`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 打开或创建与某用户的会话
   */
  const conversationsControllerOpen = (
    openConversationDto: OpenConversationDto,
  ) => {
    return httpMutator<void>({
      url: `/api/conversations/open`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: openConversationDto,
    });
  };

  /**
   * @summary 私信已读游标：推进到指定消息（通常由消息进入聊天可视区触发）
   */
  const conversationsControllerMarkReadThrough = (
    id: number,
    markDmReadThroughDto: MarkDmReadThroughDto,
  ) => {
    return httpMutator<void>({
      url: `/api/conversations/${id}/read-through`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: markDmReadThroughDto,
    });
  };

  /**
   * @summary 会话消息分页
   */
  const conversationsControllerMessages = (
    id: number,
    params?: ConversationsControllerMessagesParams,
  ) => {
    return httpMutator<void>({
      url: `/api/conversations/${id}/messages`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 发送私信
   */
  const conversationsControllerSend = (
    id: number,
    sendDirectMessageDto: SendDirectMessageDto,
  ) => {
    return httpMutator<void>({
      url: `/api/conversations/${id}/messages`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: sendDirectMessageDto,
    });
  };

  /**
   * @summary 通知中心未读数（不含私信）
   */
  const notificationsControllerUnreadCount = () => {
    return httpMutator<void>({
      url: `/api/notifications/unread-count`,
      method: "GET",
    });
  };

  /**
   * @summary 已发布系统公告详情（登录用户）
   */
  const notificationsControllerAnnouncementDetail = (id: number) => {
    return httpMutator<SystemAnnouncementPublicDto>({
      url: `/api/notifications/announcements/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 通知列表
   */
  const notificationsControllerList = (
    params?: NotificationsControllerListParams,
  ) => {
    return httpMutator<void>({
      url: `/api/notifications`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 标记通知已读
   */
  const notificationsControllerMarkRead = (
    markNotificationsReadDto: MarkNotificationsReadDto,
  ) => {
    return httpMutator<void>({
      url: `/api/notifications/read`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: markNotificationsReadDto,
    });
  };

  /**
   * @summary 用户注册
   */
  const authControllerRegister = (registerDto: RegisterDto) => {
    return httpMutator<AuthTokenResponseDto>({
      url: `/api/auth/register`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: registerDto,
    });
  };

  /**
   * @summary 是否启用腾讯云验证码及 AppId（公开）
   */
  const authControllerCaptchaConfig = () => {
    return httpMutator<CaptchaConfigResponseDto>({
      url: `/api/auth/captcha-config`,
      method: "GET",
    });
  };

  /**
   * @summary 用户名密码登录
   */
  const authControllerLogin = (loginDto: LoginDto) => {
    return httpMutator<AuthTokenResponseDto>({
      url: `/api/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: loginDto,
    });
  };

  /**
   * @summary 发送邮箱验证码
   */
  const authControllerSendCode = (sendCodeDto: SendCodeDto) => {
    return httpMutator<void>({
      url: `/api/auth/send-code`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: sendCodeDto,
    });
  };

  /**
   * @summary 邮箱验证码登录
   */
  const authControllerLoginByCode = (loginByCodeDto: LoginByCodeDto) => {
    return httpMutator<AuthTokenResponseDto>({
      url: `/api/auth/login-code`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: loginByCodeDto,
    });
  };

  /**
   * @summary 请求重置密码（发送邮件）
   */
  const authControllerRequestReset = (
    requestPasswordResetDto: RequestPasswordResetDto,
  ) => {
    return httpMutator<void>({
      url: `/api/auth/request-reset`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: requestPasswordResetDto,
    });
  };

  /**
   * @summary 重置密码
   */
  const authControllerResetPassword = (resetPasswordDto: ResetPasswordDto) => {
    return httpMutator<void>({
      url: `/api/auth/reset-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: resetPasswordDto,
    });
  };

  /**
   * @summary 传统本地策略登录（已废弃）
   */
  const authControllerLoginLegacy = () => {
    return httpMutator<void>({ url: `/api/auth/login-legacy`, method: "POST" });
  };

  /**
   * @summary 登出，主动使 token 失效
   */
  const authControllerLogout = () => {
    return httpMutator<void>({ url: `/api/auth/logout`, method: "POST" });
  };

  /**
   * @summary 获取当前用户信息
   */
  const authControllerGetProfile = () => {
    return httpMutator<UserProfileDto>({
      url: `/api/auth/profile`,
      method: "GET",
    });
  };

  /**
   * @summary 刷新 Token
   */
  const authControllerRefresh = () => {
    return httpMutator<AuthTokenResponseDto>({
      url: `/api/auth/refresh`,
      method: "POST",
    });
  };

  /**
   * @summary 创建博客评论
   */
  const commentsControllerCreate = (
    blogId: string,
    createCommentDto: CreateCommentDto,
  ) => {
    return httpMutator<CommentDto>({
      url: `/api/blogs/${blogId}/comments`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createCommentDto,
    });
  };

  /**
   * @summary 获取博客评论列表
   */
  const commentsControllerFindAll = (blogId: string) => {
    return httpMutator<CommentDto[]>({
      url: `/api/blogs/${blogId}/comments`,
      method: "GET",
    });
  };

  /**
   * @summary 获取评论详情
   */
  const commentsControllerFindOne = (blogId: unknown, id: string) => {
    return httpMutator<CommentDto>({
      url: `/api/blogs/${blogId}/comments/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新评论
   */
  const commentsControllerUpdate = (
    blogId: unknown,
    id: string,
    updateCommentDto: UpdateCommentDto,
  ) => {
    return httpMutator<Comment>({
      url: `/api/blogs/${blogId}/comments/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateCommentDto,
    });
  };

  /**
   * @summary 删除评论
   */
  const commentsControllerRemove = (blogId: unknown, id: string) => {
    return httpMutator<void>({
      url: `/api/blogs/${blogId}/comments/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 切换评论点赞状态
   */
  const commentsControllerToggleLike = (blogId: unknown, id: string) => {
    return httpMutator<ToggleCommentLikeResponseDto | void>({
      url: `/api/blogs/${blogId}/comments/${id}/like`,
      method: "POST",
    });
  };

  /**
   * @summary 切换博客点赞状态
   */
  const likesControllerToggleLike = (blogId: string) => {
    return httpMutator<ToggleLikeResponseDto | void>({
      url: `/api/blogs/${blogId}/likes`,
      method: "POST",
    });
  };

  /**
   * @summary 获取博客点赞数量
   */
  const likesControllerGetLikesCount = (blogId: string) => {
    return httpMutator<number>({
      url: `/api/blogs/${blogId}/likes/count`,
      method: "GET",
    });
  };

  /**
   * @summary 查询当前用户是否已点赞
   */
  const likesControllerHasLiked = (blogId: string) => {
    return httpMutator<boolean>({
      url: `/api/blogs/${blogId}/likes/status`,
      method: "GET",
    });
  };

  /**
   * @summary 创建日历事件
   */
  const calendarControllerCreate = (
    createCalendarEventDto: CreateCalendarEventDto,
  ) => {
    return httpMutator<CalendarEventDto>({
      url: `/api/calendar`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createCalendarEventDto,
    });
  };

  /**
   * @summary 获取日历事件列表
   */
  const calendarControllerFindAll = (
    params?: CalendarControllerFindAllParams,
  ) => {
    return httpMutator<CalendarEventDto[]>({
      url: `/api/calendar`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取日历事件详情
   */
  const calendarControllerFindOne = (id: string) => {
    return httpMutator<CalendarEventDto>({
      url: `/api/calendar/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 更新日历事件
   */
  const calendarControllerUpdate = (
    id: string,
    updateCalendarEventDto: UpdateCalendarEventDto,
  ) => {
    return httpMutator<CalendarEventDto>({
      url: `/api/calendar/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateCalendarEventDto,
    });
  };

  /**
   * @summary 删除日历事件
   */
  const calendarControllerRemove = (id: string) => {
    return httpMutator<void>({ url: `/api/calendar/${id}`, method: "DELETE" });
  };

  /**
   * @summary 切换日历事件完成状态
   */
  const calendarControllerToggleComplete = (id: string) => {
    return httpMutator<CalendarEventDto>({
      url: `/api/calendar/${id}/toggle`,
      method: "PATCH",
    });
  };

  /**
   * @summary 切换博客收藏状态
   */
  const favoritesControllerToggleFavorite = (blogId: string) => {
    return httpMutator<ToggleFavoriteResponseDto | void>({
      url: `/api/blogs/${blogId}/favorites`,
      method: "POST",
    });
  };

  /**
   * @summary 获取博客收藏数量
   */
  const favoritesControllerGetFavoritesCount = (blogId: string) => {
    return httpMutator<number>({
      url: `/api/blogs/${blogId}/favorites/count`,
      method: "GET",
    });
  };

  /**
   * @summary 查询当前用户是否已收藏
   */
  const favoritesControllerHasFavorited = (blogId: string) => {
    return httpMutator<void>({
      url: `/api/blogs/${blogId}/favorites/status`,
      method: "GET",
    });
  };

  /**
   * @summary 获取当前用户收藏的博客列表
   */
  const userFavoritesControllerGetUserFavorites = () => {
    return httpMutator<BlogDto[]>({ url: `/api/favorites`, method: "GET" });
  };

  /**
   * @summary 创建待办事项
   */
  const todosControllerCreate = (createTodoDto: CreateTodoDto) => {
    return httpMutator<TodoDto>({
      url: `/api/todos`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createTodoDto,
    });
  };

  /**
   * @summary 获取待办事项列表
   */
  const todosControllerFindAll = () => {
    return httpMutator<TodoListResponseDto>({
      url: `/api/todos`,
      method: "GET",
    });
  };

  /**
   * @summary 获取待办事项详情
   */
  const todosControllerFindOne = (id: string) => {
    return httpMutator<TodoDto>({ url: `/api/todos/${id}`, method: "GET" });
  };

  /**
   * @summary 更新待办事项
   */
  const todosControllerUpdate = (id: string, updateTodoDto: UpdateTodoDto) => {
    return httpMutator<TodoDto>({
      url: `/api/todos/${id}`,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      data: updateTodoDto,
    });
  };

  /**
   * @summary 删除待办事项
   */
  const todosControllerRemove = (id: string) => {
    return httpMutator<void>({ url: `/api/todos/${id}`, method: "DELETE" });
  };

  /**
   * @summary 切换待办事项完成状态
   */
  const todosControllerToggleComplete = (id: string) => {
    return httpMutator<TodoDto>({
      url: `/api/todos/${id}/toggle`,
      method: "PATCH",
    });
  };

  /**
   * @summary 上传图片（query.businessPath 指定业务目录，默认 common）
   */
  const uploadControllerUploadImage = (
    uploadControllerUploadImageBody: UploadControllerUploadImageBody,
    params?: UploadControllerUploadImageParams,
  ) => {
    const formData = new FormData();
    if (uploadControllerUploadImageBody.file !== undefined) {
      formData.append(`file`, uploadControllerUploadImageBody.file);
    }

    return httpMutator<UploadImageResponseDto>({
      url: `/api/upload/image`,
      method: "POST",
      data: formData,
      params,
    });
  };

  /**
   * @summary 初始化分片上传（视频 / 通用文件）
   */
  const uploadControllerInitChunkUpload = (
    initChunkUploadDto: InitChunkUploadDto,
  ) => {
    return httpMutator<void>({
      url: `/api/upload/chunk/init`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: initChunkUploadDto,
    });
  };

  /**
   * @summary 上传分片
   */
  const uploadControllerUploadChunk = (
    uploadControllerUploadChunkBody: UploadControllerUploadChunkBody,
  ) => {
    const formData = new FormData();
    if (uploadControllerUploadChunkBody.file !== undefined) {
      formData.append(`file`, uploadControllerUploadChunkBody.file);
    }
    if (uploadControllerUploadChunkBody.uploadId !== undefined) {
      formData.append(`uploadId`, uploadControllerUploadChunkBody.uploadId);
    }
    if (uploadControllerUploadChunkBody.chunkIndex !== undefined) {
      formData.append(
        `chunkIndex`,
        uploadControllerUploadChunkBody.chunkIndex.toString(),
      );
    }
    if (uploadControllerUploadChunkBody.totalChunks !== undefined) {
      formData.append(
        `totalChunks`,
        uploadControllerUploadChunkBody.totalChunks.toString(),
      );
    }

    return httpMutator<void>({
      url: `/api/upload/chunk`,
      method: "POST",
      data: formData,
    });
  };

  /**
   * @summary 合并分片
   */
  const uploadControllerMergeChunks = (mergeUploadDto: MergeUploadDto) => {
    return httpMutator<void>({
      url: `/api/upload/chunk/merge`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: mergeUploadDto,
    });
  };

  /**
   * @summary 查询分片上传状态
   */
  const uploadControllerGetChunkStatus = (uploadId: string) => {
    return httpMutator<void>({
      url: `/api/upload/chunk/status/${uploadId}`,
      method: "GET",
    });
  };

  /**
   * @summary 取消分片上传
   */
  const uploadControllerCancelChunkUpload = (uploadId: string) => {
    return httpMutator<void>({
      url: `/api/upload/chunk/cancel/${uploadId}`,
      method: "POST",
    });
  };

  /**
   * @summary 创建沸点
   */
  const momentsControllerCreate = (createMomentDto: CreateMomentDto) => {
    return httpMutator<MomentDto>({
      url: `/api/moments`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createMomentDto,
    });
  };

  /**
   * @summary 获取沸点列表
   */
  const momentsControllerFindAll = (
    params?: MomentsControllerFindAllParams,
  ) => {
    return httpMutator<MomentListResponseDto>({
      url: `/api/moments`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取沸点详情
   */
  const momentsControllerFindOne = (id: string) => {
    return httpMutator<MomentDto>({ url: `/api/moments/${id}`, method: "GET" });
  };

  /**
   * @summary 删除沸点
   */
  const momentsControllerRemove = (id: string) => {
    return httpMutator<void>({ url: `/api/moments/${id}`, method: "DELETE" });
  };

  /**
   * @summary 更新沸点
   */
  const momentsControllerUpdate = (
    id: string,
    updateMomentDto: UpdateMomentDto,
  ) => {
    return httpMutator<MomentDto>({
      url: `/api/moments/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      data: updateMomentDto,
    });
  };

  /**
   * @summary 切换沸点点赞状态
   */
  const momentsControllerToggleLike = (id: string) => {
    return httpMutator<ToggleMomentLikeResponseDto | void>({
      url: `/api/moments/${id}/like`,
      method: "POST",
    });
  };

  /**
   * @summary 切换沸点收藏状态
   */
  const momentsControllerToggleFavorite = (id: string) => {
    return httpMutator<ToggleMomentFavoriteResponseDto | void>({
      url: `/api/moments/${id}/favorite`,
      method: "POST",
    });
  };

  /**
   * @summary 获取沸点评论列表
   */
  const momentsControllerGetComments = (id: string) => {
    return httpMutator<CommentDto[]>({
      url: `/api/moments/${id}/comments`,
      method: "GET",
    });
  };

  /**
   * @summary 创建沸点评论
   */
  const momentsControllerCreateComment = (
    id: string,
    createMomentCommentDto: CreateMomentCommentDto,
  ) => {
    return httpMutator<CommentDto>({
      url: `/api/moments/${id}/comments`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createMomentCommentDto,
    });
  };

  /**
   * @summary 删除沸点评论
   */
  const momentsControllerRemoveComment = (commentId: string) => {
    return httpMutator<void>({
      url: `/api/moments/comments/${commentId}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 切换沸点评论点赞状态
   */
  const momentsControllerToggleCommentLike = (commentId: string) => {
    return httpMutator<void>({
      url: `/api/moments/comments/${commentId}/like`,
      method: "POST",
    });
  };

  /**
   * @summary 获取我收藏的沸点列表
   */
  const momentsControllerGetFavorites = () => {
    return httpMutator<MomentsControllerGetFavorites200Item[]>({
      url: `/api/moments/favorites/my`,
      method: "GET",
    });
  };

  /**
   * @summary 创建话题
   */
  const topicsControllerCreate = (createTopicDto: CreateTopicDto) => {
    return httpMutator<void>({
      url: `/api/topics`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createTopicDto,
    });
  };

  /**
   * @summary 获取话题列表
   */
  const topicsControllerFindAll = () => {
    return httpMutator<void>({ url: `/api/topics`, method: "GET" });
  };

  /**
   * @summary 获取热门话题列表
   */
  const topicsControllerFindHot = () => {
    return httpMutator<void>({ url: `/api/topics/hot`, method: "GET" });
  };

  /**
   * @summary 获取话题详情（包含笔记列表）
   */
  const topicsControllerFindOne = (
    id: string,
    params?: TopicsControllerFindOneParams,
  ) => {
    return httpMutator<void>({
      url: `/api/topics/${id}`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 获取全平台热搜
   */
  const hotsearchControllerGetHotSearch = (
    params?: HotsearchControllerGetHotSearchParams,
  ) => {
    return httpMutator<HotsearchControllerGetHotSearch200>({
      url: `/api/hotsearch`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 强制刷新热搜缓存（管理员用）
   */
  const hotsearchControllerRefreshCache = () => {
    return httpMutator<HotsearchControllerRefreshCache200>({
      url: `/api/hotsearch/refresh`,
      method: "GET",
    });
  };

  /**
   * @summary 获取微博热搜
   */
  const hotsearchControllerGetWeiboHot = () => {
    return httpMutator<HotsearchControllerGetWeiboHot200Item[]>({
      url: `/api/hotsearch/weibo`,
      method: "GET",
    });
  };

  /**
   * @summary 获取 B 站热搜
   */
  const hotsearchControllerGetBilibiliHot = () => {
    return httpMutator<HotsearchControllerGetBilibiliHot200Item[]>({
      url: `/api/hotsearch/bilibili`,
      method: "GET",
    });
  };

  /**
   * @summary 获取 GitHub Trending
   */
  const hotsearchControllerGetGitHubHot = () => {
    return httpMutator<HotsearchControllerGetGitHubHot200Item[]>({
      url: `/api/hotsearch/github`,
      method: "GET",
    });
  };

  /**
   * @summary 根据 IP 或城市获取天气
   */
  const weatherControllerGetWeather = (
    params?: WeatherControllerGetWeatherParams,
  ) => {
    return httpMutator<WeatherControllerGetWeather200>({
      url: `/api/weather`,
      method: "GET",
      params,
    });
  };

  /**
   * @summary 初始化管理员
   */
  const adminControllerInitAdmin = () => {
    return httpMutator<AdminControllerInitAdmin201>({
      url: `/api/admin/init-admin`,
      method: "POST",
    });
  };

  const adminControllerLogin = (adminLoginDto: AdminLoginDto) => {
    return httpMutator<void>({
      url: `/api/admin/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: adminLoginDto,
    });
  };

  const adminControllerGetProfile = () => {
    return httpMutator<void>({ url: `/api/admin/auth/profile`, method: "GET" });
  };

  const adminControllerGetDashboardStats = () => {
    return httpMutator<void>({
      url: `/api/admin/dashboard/stats`,
      method: "GET",
    });
  };

  const adminControllerGetMomentsStats = () => {
    return httpMutator<void>({
      url: `/api/admin/dashboard/moments-stats`,
      method: "GET",
    });
  };

  const adminControllerGetDailyViews = (
    params?: AdminControllerGetDailyViewsParams,
  ) => {
    return httpMutator<DailyViewItemDto[]>({
      url: `/api/admin/dashboard/daily-views`,
      method: "GET",
      params,
    });
  };

  const adminControllerGetTopics = (
    params?: AdminControllerGetTopicsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/topics`,
      method: "GET",
      params,
    });
  };

  const adminControllerCreateTopic = (
    adminCreateTopicDto: AdminCreateTopicDto,
  ) => {
    return httpMutator<Topic>({
      url: `/api/admin/topics`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: adminCreateTopicDto,
    });
  };

  const adminControllerUpdateTopic = (
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

  const adminControllerDeleteTopic = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/topics/${id}`,
      method: "DELETE",
    });
  };

  const adminControllerGetBlogComments = (
    params?: AdminControllerGetBlogCommentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/blog`,
      method: "GET",
      params,
    });
  };

  const adminControllerGetTopicComments = (
    params?: AdminControllerGetTopicCommentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/topic`,
      method: "GET",
      params,
    });
  };

  const adminControllerGetUsers = (params?: AdminControllerGetUsersParams) => {
    return httpMutator<void>({
      url: `/api/admin/users`,
      method: "GET",
      params,
    });
  };

  const adminControllerCreateUser = (createUserDto: CreateUserDto) => {
    return httpMutator<User>({
      url: `/api/admin/users`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createUserDto,
    });
  };

  const adminControllerGetUserById = (id: number) => {
    return httpMutator<User>({ url: `/api/admin/users/${id}`, method: "GET" });
  };

  const adminControllerUpdateUser = (
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

  const adminControllerDeleteUser = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/users/${id}`,
      method: "DELETE",
    });
  };

  const adminControllerUpdateUserStatus = (
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

  const adminControllerGetBlogs = (params?: AdminControllerGetBlogsParams) => {
    return httpMutator<void>({
      url: `/api/admin/blogs`,
      method: "GET",
      params,
    });
  };

  const adminControllerGetBlogById = (id: number) => {
    return httpMutator<Blog>({ url: `/api/admin/blogs/${id}`, method: "GET" });
  };

  const adminControllerUpdateBlog = (
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

  const adminControllerDeleteBlog = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/blogs/${id}`,
      method: "DELETE",
    });
  };

  const adminControllerToggleBlogPublish = (
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

  const adminControllerGetMoments = (
    params?: AdminControllerGetMomentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/moments`,
      method: "GET",
      params,
    });
  };

  const adminControllerGetMomentById = (id: number) => {
    return httpMutator<Moment>({
      url: `/api/admin/moments/${id}`,
      method: "GET",
    });
  };

  const adminControllerUpdateMoment = (
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

  const adminControllerDeleteMoment = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/moments/${id}`,
      method: "DELETE",
    });
  };

  const adminControllerGetComments = (
    params?: AdminControllerGetCommentsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments`,
      method: "GET",
      params,
    });
  };

  const adminControllerDeleteComment = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/comments/${id}`,
      method: "DELETE",
    });
  };

  const adminControllerBatchDeleteComments = (
    batchDeleteCommentsDto: BatchDeleteCommentsDto,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/comments/batch-delete`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: batchDeleteCommentsDto,
    });
  };

  const adminControllerGetSystemAnnouncements = (
    params?: AdminControllerGetSystemAnnouncementsParams,
  ) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements`,
      method: "GET",
      params,
    });
  };

  const adminControllerCreateSystemAnnouncement = (
    createSystemAnnouncementDto: CreateSystemAnnouncementDto,
  ) => {
    return httpMutator<SystemAnnouncement>({
      url: `/api/admin/system-announcements`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createSystemAnnouncementDto,
    });
  };

  const adminControllerGetSystemAnnouncementById = (id: number) => {
    return httpMutator<SystemAnnouncement>({
      url: `/api/admin/system-announcements/${id}`,
      method: "GET",
    });
  };

  const adminControllerUpdateSystemAnnouncement = (
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

  const adminControllerDeleteSystemAnnouncement = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}`,
      method: "DELETE",
    });
  };

  const adminControllerPublishSystemAnnouncement = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/publish`,
      method: "POST",
    });
  };

  const adminControllerRecallSystemAnnouncement = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/recall`,
      method: "POST",
    });
  };

  const adminControllerSyncSystemAnnouncementNotifications = (id: number) => {
    return httpMutator<void>({
      url: `/api/admin/system-announcements/${id}/sync-notifications`,
      method: "POST",
    });
  };

  /**
   * @summary 创建笔记
   */
  const notesControllerCreate = (createNoteDto: CreateNoteDto) => {
    return httpMutator<void>({
      url: `/api/notes`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createNoteDto,
    });
  };

  /**
   * @summary 获取笔记列表
   */
  const notesControllerFindAll = (params?: NotesControllerFindAllParams) => {
    return httpMutator<void>({ url: `/api/notes`, method: "GET", params });
  };

  /**
   * @summary 获取笔记详情
   */
  const notesControllerFindOne = (id: string) => {
    return httpMutator<void>({ url: `/api/notes/${id}`, method: "GET" });
  };

  /**
   * @summary 删除笔记
   */
  const notesControllerRemove = (id: string) => {
    return httpMutator<void>({ url: `/api/notes/${id}`, method: "DELETE" });
  };

  /**
   * @summary 切换笔记点赞状态
   */
  const notesControllerToggleLike = (id: string) => {
    return httpMutator<void>({ url: `/api/notes/${id}/like`, method: "POST" });
  };

  /**
   * @summary 切换笔记收藏状态
   */
  const notesControllerToggleFavorite = (id: string) => {
    return httpMutator<void>({
      url: `/api/notes/${id}/favorite`,
      method: "POST",
    });
  };

  /**
   * @summary 获取笔记评论列表（嵌套结构）
   */
  const notesControllerGetComments = (id: string) => {
    return httpMutator<void>({
      url: `/api/notes/${id}/comments`,
      method: "GET",
    });
  };

  /**
   * @summary 创建笔记评论
   */
  const notesControllerCreateComment = (
    id: string,
    createNoteCommentDto: CreateNoteCommentDto,
  ) => {
    return httpMutator<void>({
      url: `/api/notes/${id}/comments`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createNoteCommentDto,
    });
  };

  /**
   * @summary 删除笔记评论
   */
  const notesControllerRemoveComment = (commentId: string) => {
    return httpMutator<void>({
      url: `/api/notes/comments/${commentId}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 切换评论点赞状态
   */
  const notesControllerToggleCommentLike = (commentId: string) => {
    return httpMutator<void>({
      url: `/api/notes/comments/${commentId}/like`,
      method: "POST",
    });
  };

  /**
   * @summary 获取我收藏的笔记列表
   */
  const notesControllerGetFavorites = () => {
    return httpMutator<NotesControllerGetFavorites200Item[]>({
      url: `/api/notes/favorites/my`,
      method: "GET",
    });
  };

  /**
   * @summary 创建收藏夹
   */
  const noteCollectionsControllerCreate = (
    createNoteCollectionDto: CreateNoteCollectionDto,
  ) => {
    return httpMutator<void>({
      url: `/api/note-collections`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: createNoteCollectionDto,
    });
  };

  /**
   * @summary 获取我的收藏夹列表
   */
  const noteCollectionsControllerFindMyCollections = () => {
    return httpMutator<void>({ url: `/api/note-collections`, method: "GET" });
  };

  /**
   * @summary 获取笔记所在收藏夹列表
   */
  const noteCollectionsControllerGetNoteCollections = (noteId: string) => {
    return httpMutator<NoteCollection[]>({
      url: `/api/note-collections/note/${noteId}`,
      method: "GET",
    });
  };

  /**
   * @summary 获取收藏夹详情
   */
  const noteCollectionsControllerFindOne = (id: string) => {
    return httpMutator<void>({
      url: `/api/note-collections/${id}`,
      method: "GET",
    });
  };

  /**
   * @summary 删除收藏夹
   */
  const noteCollectionsControllerRemove = (id: string) => {
    return httpMutator<void>({
      url: `/api/note-collections/${id}`,
      method: "DELETE",
    });
  };

  /**
   * @summary 收藏笔记到指定收藏夹
   */
  const noteCollectionsNoteControllerAddNoteToCollection = (
    id: string,
    addNoteToCollectionDto: AddNoteToCollectionDto,
  ) => {
    return httpMutator<void>({
      url: `/api/notes/${id}/collect`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: addNoteToCollectionDto,
    });
  };

  /**
   * @summary 从收藏夹移除笔记
   */
  const noteCollectionsNoteControllerRemoveNoteFromCollection = (
    id: string,
    collectionId: string,
  ) => {
    return httpMutator<void>({
      url: `/api/notes/${id}/collect/${collectionId}`,
      method: "DELETE",
    });
  };

  /**
   * @summary AI 聊天接口
   */
  const aIControllerChat = (chatRequestDto: ChatRequestDto) => {
    return httpMutator<ChatResponseDto>({
      url: `/api/ai/chat`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: chatRequestDto,
    });
  };

  /**
   * @summary AI 聊天流式接口（SSE）
   */
  const aIControllerChatStream = (chatRequestDto: ChatRequestDto) => {
    return httpMutator<void>({
      url: `/api/ai/chat/stream`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: chatRequestDto,
    });
  };

  /**
   * @summary 保存用户 AI 模型配置
   */
  const aIControllerSaveConfig = (saveAIConfigDto: SaveAIConfigDto) => {
    return httpMutator<void>({
      url: `/api/ai/config`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: saveAIConfigDto,
    });
  };

  /**
   * @summary 获取 AI 配置传输加密公钥
   */
  const aIControllerGetConfigPublicKey = () => {
    return httpMutator<void>({
      url: `/api/ai/config/public-key`,
      method: "GET",
    });
  };

  /**
   * @summary 获取用户 AI 模型配置
   */
  const aIControllerGetConfig = () => {
    return httpMutator<void>({ url: `/api/ai/config/get`, method: "POST" });
  };

  return {
    appControllerGetHello,
    appControllerGetStats,
    appControllerTrackPageView,
    blogsControllerCreate,
    blogsControllerFindAll,
    blogsControllerGetRecommended,
    blogsControllerFindMyBlogs,
    blogsControllerFindOne,
    blogsControllerUpdate,
    blogsControllerRemove,
    blogsControllerTogglePublish,
    usersControllerFindOne,
    usersControllerUpdateProfile,
    usersControllerGetResume,
    usersControllerUpdateResume,
    followsControllerFollow,
    followsControllerUnfollow,
    followsControllerFollowers,
    followsControllerFollowing,
    followsControllerFollowStatus,
    conversationsControllerUnreadCount,
    conversationsControllerList,
    conversationsControllerOpen,
    conversationsControllerMarkReadThrough,
    conversationsControllerMessages,
    conversationsControllerSend,
    notificationsControllerUnreadCount,
    notificationsControllerAnnouncementDetail,
    notificationsControllerList,
    notificationsControllerMarkRead,
    authControllerRegister,
    authControllerCaptchaConfig,
    authControllerLogin,
    authControllerSendCode,
    authControllerLoginByCode,
    authControllerRequestReset,
    authControllerResetPassword,
    authControllerLoginLegacy,
    authControllerLogout,
    authControllerGetProfile,
    authControllerRefresh,
    commentsControllerCreate,
    commentsControllerFindAll,
    commentsControllerFindOne,
    commentsControllerUpdate,
    commentsControllerRemove,
    commentsControllerToggleLike,
    likesControllerToggleLike,
    likesControllerGetLikesCount,
    likesControllerHasLiked,
    calendarControllerCreate,
    calendarControllerFindAll,
    calendarControllerFindOne,
    calendarControllerUpdate,
    calendarControllerRemove,
    calendarControllerToggleComplete,
    favoritesControllerToggleFavorite,
    favoritesControllerGetFavoritesCount,
    favoritesControllerHasFavorited,
    userFavoritesControllerGetUserFavorites,
    todosControllerCreate,
    todosControllerFindAll,
    todosControllerFindOne,
    todosControllerUpdate,
    todosControllerRemove,
    todosControllerToggleComplete,
    uploadControllerUploadImage,
    uploadControllerInitChunkUpload,
    uploadControllerUploadChunk,
    uploadControllerMergeChunks,
    uploadControllerGetChunkStatus,
    uploadControllerCancelChunkUpload,
    momentsControllerCreate,
    momentsControllerFindAll,
    momentsControllerFindOne,
    momentsControllerRemove,
    momentsControllerUpdate,
    momentsControllerToggleLike,
    momentsControllerToggleFavorite,
    momentsControllerGetComments,
    momentsControllerCreateComment,
    momentsControllerRemoveComment,
    momentsControllerToggleCommentLike,
    momentsControllerGetFavorites,
    topicsControllerCreate,
    topicsControllerFindAll,
    topicsControllerFindHot,
    topicsControllerFindOne,
    hotsearchControllerGetHotSearch,
    hotsearchControllerRefreshCache,
    hotsearchControllerGetWeiboHot,
    hotsearchControllerGetBilibiliHot,
    hotsearchControllerGetGitHubHot,
    weatherControllerGetWeather,
    adminControllerInitAdmin,
    adminControllerLogin,
    adminControllerGetProfile,
    adminControllerGetDashboardStats,
    adminControllerGetMomentsStats,
    adminControllerGetDailyViews,
    adminControllerGetTopics,
    adminControllerCreateTopic,
    adminControllerUpdateTopic,
    adminControllerDeleteTopic,
    adminControllerGetBlogComments,
    adminControllerGetTopicComments,
    adminControllerGetUsers,
    adminControllerCreateUser,
    adminControllerGetUserById,
    adminControllerUpdateUser,
    adminControllerDeleteUser,
    adminControllerUpdateUserStatus,
    adminControllerGetBlogs,
    adminControllerGetBlogById,
    adminControllerUpdateBlog,
    adminControllerDeleteBlog,
    adminControllerToggleBlogPublish,
    adminControllerGetMoments,
    adminControllerGetMomentById,
    adminControllerUpdateMoment,
    adminControllerDeleteMoment,
    adminControllerGetComments,
    adminControllerDeleteComment,
    adminControllerBatchDeleteComments,
    adminControllerGetSystemAnnouncements,
    adminControllerCreateSystemAnnouncement,
    adminControllerGetSystemAnnouncementById,
    adminControllerUpdateSystemAnnouncement,
    adminControllerDeleteSystemAnnouncement,
    adminControllerPublishSystemAnnouncement,
    adminControllerRecallSystemAnnouncement,
    adminControllerSyncSystemAnnouncementNotifications,
    notesControllerCreate,
    notesControllerFindAll,
    notesControllerFindOne,
    notesControllerRemove,
    notesControllerToggleLike,
    notesControllerToggleFavorite,
    notesControllerGetComments,
    notesControllerCreateComment,
    notesControllerRemoveComment,
    notesControllerToggleCommentLike,
    notesControllerGetFavorites,
    noteCollectionsControllerCreate,
    noteCollectionsControllerFindMyCollections,
    noteCollectionsControllerGetNoteCollections,
    noteCollectionsControllerFindOne,
    noteCollectionsControllerRemove,
    noteCollectionsNoteControllerAddNoteToCollection,
    noteCollectionsNoteControllerRemoveNoteFromCollection,
    aIControllerChat,
    aIControllerChatStream,
    aIControllerSaveConfig,
    aIControllerGetConfigPublicKey,
    aIControllerGetConfig,
  };
};
export type AppControllerGetHelloResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["appControllerGetHello"]>>
>;
export type AppControllerGetStatsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["appControllerGetStats"]>>
>;
export type AppControllerTrackPageViewResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["appControllerTrackPageView"]>
  >
>;
export type BlogsControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerCreate"]>>
>;
export type BlogsControllerFindAllResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerFindAll"]>>
>;
export type BlogsControllerGetRecommendedResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerGetRecommended"]>
  >
>;
export type BlogsControllerFindMyBlogsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerFindMyBlogs"]>
  >
>;
export type BlogsControllerFindOneResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerFindOne"]>>
>;
export type BlogsControllerUpdateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerUpdate"]>>
>;
export type BlogsControllerRemoveResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerRemove"]>>
>;
export type BlogsControllerTogglePublishResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["blogsControllerTogglePublish"]>
  >
>;
export type UsersControllerFindOneResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["usersControllerFindOne"]>>
>;
export type UsersControllerUpdateProfileResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["usersControllerUpdateProfile"]>
  >
>;
export type UsersControllerGetResumeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["usersControllerGetResume"]>>
>;
export type UsersControllerUpdateResumeResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["usersControllerUpdateResume"]>
  >
>;
export type FollowsControllerFollowResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["followsControllerFollow"]>>
>;
export type FollowsControllerUnfollowResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["followsControllerUnfollow"]>
  >
>;
export type FollowsControllerFollowersResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["followsControllerFollowers"]>
  >
>;
export type FollowsControllerFollowingResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["followsControllerFollowing"]>
  >
>;
export type FollowsControllerFollowStatusResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["followsControllerFollowStatus"]>
  >
>;
export type ConversationsControllerUnreadCountResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["conversationsControllerUnreadCount"]
    >
  >
>;
export type ConversationsControllerListResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["conversationsControllerList"]>
  >
>;
export type ConversationsControllerOpenResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["conversationsControllerOpen"]>
  >
>;
export type ConversationsControllerMarkReadThroughResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["conversationsControllerMarkReadThrough"]
    >
  >
>;
export type ConversationsControllerMessagesResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["conversationsControllerMessages"]>
  >
>;
export type ConversationsControllerSendResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["conversationsControllerSend"]>
  >
>;
export type NotificationsControllerUnreadCountResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["notificationsControllerUnreadCount"]
    >
  >
>;
export type NotificationsControllerAnnouncementDetailResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["notificationsControllerAnnouncementDetail"]
    >
  >
>;
export type NotificationsControllerListResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notificationsControllerList"]>
  >
>;
export type NotificationsControllerMarkReadResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notificationsControllerMarkRead"]>
  >
>;
export type AuthControllerRegisterResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["authControllerRegister"]>>
>;
export type AuthControllerCaptchaConfigResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["authControllerCaptchaConfig"]>
  >
>;
export type AuthControllerLoginResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["authControllerLogin"]>>
>;
export type AuthControllerSendCodeResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["authControllerSendCode"]>>
>;
export type AuthControllerLoginByCodeResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["authControllerLoginByCode"]>
  >
>;
export type AuthControllerRequestResetResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["authControllerRequestReset"]>
  >
>;
export type AuthControllerResetPasswordResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["authControllerResetPassword"]>
  >
>;
export type AuthControllerLoginLegacyResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["authControllerLoginLegacy"]>
  >
>;
export type AuthControllerLogoutResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["authControllerLogout"]>>
>;
export type AuthControllerGetProfileResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["authControllerGetProfile"]>>
>;
export type AuthControllerRefreshResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["authControllerRefresh"]>>
>;
export type CommentsControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["commentsControllerCreate"]>>
>;
export type CommentsControllerFindAllResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["commentsControllerFindAll"]>
  >
>;
export type CommentsControllerFindOneResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["commentsControllerFindOne"]>
  >
>;
export type CommentsControllerUpdateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["commentsControllerUpdate"]>>
>;
export type CommentsControllerRemoveResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["commentsControllerRemove"]>>
>;
export type CommentsControllerToggleLikeResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["commentsControllerToggleLike"]>
  >
>;
export type LikesControllerToggleLikeResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["likesControllerToggleLike"]>
  >
>;
export type LikesControllerGetLikesCountResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["likesControllerGetLikesCount"]>
  >
>;
export type LikesControllerHasLikedResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["likesControllerHasLiked"]>>
>;
export type CalendarControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["calendarControllerCreate"]>>
>;
export type CalendarControllerFindAllResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["calendarControllerFindAll"]>
  >
>;
export type CalendarControllerFindOneResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["calendarControllerFindOne"]>
  >
>;
export type CalendarControllerUpdateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["calendarControllerUpdate"]>>
>;
export type CalendarControllerRemoveResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["calendarControllerRemove"]>>
>;
export type CalendarControllerToggleCompleteResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["calendarControllerToggleComplete"]
    >
  >
>;
export type FavoritesControllerToggleFavoriteResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["favoritesControllerToggleFavorite"]
    >
  >
>;
export type FavoritesControllerGetFavoritesCountResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["favoritesControllerGetFavoritesCount"]
    >
  >
>;
export type FavoritesControllerHasFavoritedResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["favoritesControllerHasFavorited"]>
  >
>;
export type UserFavoritesControllerGetUserFavoritesResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["userFavoritesControllerGetUserFavorites"]
    >
  >
>;
export type TodosControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["todosControllerCreate"]>>
>;
export type TodosControllerFindAllResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["todosControllerFindAll"]>>
>;
export type TodosControllerFindOneResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["todosControllerFindOne"]>>
>;
export type TodosControllerUpdateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["todosControllerUpdate"]>>
>;
export type TodosControllerRemoveResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["todosControllerRemove"]>>
>;
export type TodosControllerToggleCompleteResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["todosControllerToggleComplete"]>
  >
>;
export type UploadControllerUploadImageResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["uploadControllerUploadImage"]>
  >
>;
export type UploadControllerInitChunkUploadResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["uploadControllerInitChunkUpload"]>
  >
>;
export type UploadControllerUploadChunkResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["uploadControllerUploadChunk"]>
  >
>;
export type UploadControllerMergeChunksResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["uploadControllerMergeChunks"]>
  >
>;
export type UploadControllerGetChunkStatusResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["uploadControllerGetChunkStatus"]>
  >
>;
export type UploadControllerCancelChunkUploadResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["uploadControllerCancelChunkUpload"]
    >
  >
>;
export type MomentsControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerCreate"]>>
>;
export type MomentsControllerFindAllResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerFindAll"]>>
>;
export type MomentsControllerFindOneResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerFindOne"]>>
>;
export type MomentsControllerRemoveResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerRemove"]>>
>;
export type MomentsControllerUpdateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerUpdate"]>>
>;
export type MomentsControllerToggleLikeResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerToggleLike"]>
  >
>;
export type MomentsControllerToggleFavoriteResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerToggleFavorite"]>
  >
>;
export type MomentsControllerGetCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerGetComments"]>
  >
>;
export type MomentsControllerCreateCommentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerCreateComment"]>
  >
>;
export type MomentsControllerRemoveCommentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerRemoveComment"]>
  >
>;
export type MomentsControllerToggleCommentLikeResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["momentsControllerToggleCommentLike"]
    >
  >
>;
export type MomentsControllerGetFavoritesResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["momentsControllerGetFavorites"]>
  >
>;
export type TopicsControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["topicsControllerCreate"]>>
>;
export type TopicsControllerFindAllResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["topicsControllerFindAll"]>>
>;
export type TopicsControllerFindHotResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["topicsControllerFindHot"]>>
>;
export type TopicsControllerFindOneResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["topicsControllerFindOne"]>>
>;
export type HotsearchControllerGetHotSearchResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["hotsearchControllerGetHotSearch"]>
  >
>;
export type HotsearchControllerRefreshCacheResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["hotsearchControllerRefreshCache"]>
  >
>;
export type HotsearchControllerGetWeiboHotResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["hotsearchControllerGetWeiboHot"]>
  >
>;
export type HotsearchControllerGetBilibiliHotResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["hotsearchControllerGetBilibiliHot"]
    >
  >
>;
export type HotsearchControllerGetGitHubHotResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["hotsearchControllerGetGitHubHot"]>
  >
>;
export type WeatherControllerGetWeatherResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["weatherControllerGetWeather"]>
  >
>;
export type AdminControllerInitAdminResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["adminControllerInitAdmin"]>>
>;
export type AdminControllerLoginResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["adminControllerLogin"]>>
>;
export type AdminControllerGetProfileResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetProfile"]>
  >
>;
export type AdminControllerGetDashboardStatsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerGetDashboardStats"]
    >
  >
>;
export type AdminControllerGetMomentsStatsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetMomentsStats"]>
  >
>;
export type AdminControllerGetDailyViewsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetDailyViews"]>
  >
>;
export type AdminControllerGetTopicsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetTopics"]>>
>;
export type AdminControllerCreateTopicResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerCreateTopic"]>
  >
>;
export type AdminControllerUpdateTopicResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerUpdateTopic"]>
  >
>;
export type AdminControllerDeleteTopicResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerDeleteTopic"]>
  >
>;
export type AdminControllerGetBlogCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetBlogComments"]>
  >
>;
export type AdminControllerGetTopicCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetTopicComments"]>
  >
>;
export type AdminControllerGetUsersResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetUsers"]>>
>;
export type AdminControllerCreateUserResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerCreateUser"]>
  >
>;
export type AdminControllerGetUserByIdResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetUserById"]>
  >
>;
export type AdminControllerUpdateUserResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerUpdateUser"]>
  >
>;
export type AdminControllerDeleteUserResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerDeleteUser"]>
  >
>;
export type AdminControllerUpdateUserStatusResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerUpdateUserStatus"]>
  >
>;
export type AdminControllerGetBlogsResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetBlogs"]>>
>;
export type AdminControllerGetBlogByIdResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetBlogById"]>
  >
>;
export type AdminControllerUpdateBlogResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerUpdateBlog"]>
  >
>;
export type AdminControllerDeleteBlogResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerDeleteBlog"]>
  >
>;
export type AdminControllerToggleBlogPublishResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerToggleBlogPublish"]
    >
  >
>;
export type AdminControllerGetMomentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetMoments"]>
  >
>;
export type AdminControllerGetMomentByIdResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetMomentById"]>
  >
>;
export type AdminControllerUpdateMomentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerUpdateMoment"]>
  >
>;
export type AdminControllerDeleteMomentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerDeleteMoment"]>
  >
>;
export type AdminControllerGetCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerGetComments"]>
  >
>;
export type AdminControllerDeleteCommentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["adminControllerDeleteComment"]>
  >
>;
export type AdminControllerBatchDeleteCommentsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerBatchDeleteComments"]
    >
  >
>;
export type AdminControllerGetSystemAnnouncementsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerGetSystemAnnouncements"]
    >
  >
>;
export type AdminControllerCreateSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerCreateSystemAnnouncement"]
    >
  >
>;
export type AdminControllerGetSystemAnnouncementByIdResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerGetSystemAnnouncementById"]
    >
  >
>;
export type AdminControllerUpdateSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerUpdateSystemAnnouncement"]
    >
  >
>;
export type AdminControllerDeleteSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerDeleteSystemAnnouncement"]
    >
  >
>;
export type AdminControllerPublishSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerPublishSystemAnnouncement"]
    >
  >
>;
export type AdminControllerRecallSystemAnnouncementResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["adminControllerRecallSystemAnnouncement"]
    >
  >
>;
export type AdminControllerSyncSystemAnnouncementNotificationsResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAPI
        >["adminControllerSyncSystemAnnouncementNotifications"]
      >
    >
  >;
export type NotesControllerCreateResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["notesControllerCreate"]>>
>;
export type NotesControllerFindAllResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["notesControllerFindAll"]>>
>;
export type NotesControllerFindOneResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["notesControllerFindOne"]>>
>;
export type NotesControllerRemoveResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["notesControllerRemove"]>>
>;
export type NotesControllerToggleLikeResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notesControllerToggleLike"]>
  >
>;
export type NotesControllerToggleFavoriteResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notesControllerToggleFavorite"]>
  >
>;
export type NotesControllerGetCommentsResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notesControllerGetComments"]>
  >
>;
export type NotesControllerCreateCommentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notesControllerCreateComment"]>
  >
>;
export type NotesControllerRemoveCommentResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notesControllerRemoveComment"]>
  >
>;
export type NotesControllerToggleCommentLikeResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["notesControllerToggleCommentLike"]
    >
  >
>;
export type NotesControllerGetFavoritesResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["notesControllerGetFavorites"]>
  >
>;
export type NoteCollectionsControllerCreateResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["noteCollectionsControllerCreate"]>
  >
>;
export type NoteCollectionsControllerFindMyCollectionsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAPI
      >["noteCollectionsControllerFindMyCollections"]
    >
  >
>;
export type NoteCollectionsControllerGetNoteCollectionsResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<
        typeof getBlogAPI
      >["noteCollectionsControllerGetNoteCollections"]
    >
  >
>;
export type NoteCollectionsControllerFindOneResult = NonNullable<
  Awaited<
    ReturnType<
      ReturnType<typeof getBlogAPI>["noteCollectionsControllerFindOne"]
    >
  >
>;
export type NoteCollectionsControllerRemoveResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["noteCollectionsControllerRemove"]>
  >
>;
export type NoteCollectionsNoteControllerAddNoteToCollectionResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAPI
        >["noteCollectionsNoteControllerAddNoteToCollection"]
      >
    >
  >;
export type NoteCollectionsNoteControllerRemoveNoteFromCollectionResult =
  NonNullable<
    Awaited<
      ReturnType<
        ReturnType<
          typeof getBlogAPI
        >["noteCollectionsNoteControllerRemoveNoteFromCollection"]
      >
    >
  >;
export type AIControllerChatResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["aIControllerChat"]>>
>;
export type AIControllerChatStreamResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["aIControllerChatStream"]>>
>;
export type AIControllerSaveConfigResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["aIControllerSaveConfig"]>>
>;
export type AIControllerGetConfigPublicKeyResult = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof getBlogAPI>["aIControllerGetConfigPublicKey"]>
  >
>;
export type AIControllerGetConfigResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getBlogAPI>["aIControllerGetConfig"]>>
>;
