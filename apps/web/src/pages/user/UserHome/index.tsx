import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Tabs,
  Skeleton,
  Divider,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserOutlined,
  CalendarOutlined,
  LikeOutlined,
  EyeOutlined,
  StarOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  EditOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '@store/index';
import httpService from '@services/http';
import { getBlogCoverStyle } from '@utils/blogCover';
import CustomEmpty from '@/components/CustomEmpty';
import { usersControllerGetResume } from '@services/generated/users/users';
import type { UserResumeDto } from '@services/generated/model';
import {
  followUser,
  unfollowUser,
  getFollowStatus,
} from '@services/social';
import { useTranslation } from 'react-i18next';
import './index.less';

// ── 本地类型（等 generate:api 后可删除） ─────────────────────
interface UserProfile {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
}

interface BlogItem {
  id: number;
  title: string;
  summary: string;
  cover: string | null;
  tags: string[];
  viewCount: number;
  likesCount: number;
  favoritesCount: number;
  commentCount: number;
  createdAt: string;
}

interface BlogListResp {
  list: BlogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── 渐变 Banner 颜色（按 id 取模） ───────────────────────────
const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
];

// ── 格式化数字（1k、10k…） ────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const UserHomePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const userId = Number(id);

  // ── 拉取用户信息 ─────────────────────────────────────────────
  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const res = await httpService.get<UserProfile>(`/api/users/${userId}`);
      return res.data;
    },
    enabled: !!userId,
  });

  // ── 拉取该用户已发布的博客 ──────────────────────────────────
  const { data: blogsData, isLoading: blogsLoading } = useQuery<BlogListResp>({
    queryKey: ['user-blogs', userId],
    queryFn: async () => {
      const res = await httpService.get<BlogListResp>('/api/blogs', {
        params: { authorId: userId, pageSize: 50 },
      });
      return res.data;
    },
    enabled: !!userId,
  });

  // ── 拉取该用户简历公开状态（用于入口展示） ───────────────────────
  const { data: resumeData } = useQuery<UserResumeDto>({
    queryKey: ['user-resume', userId],
    queryFn: () => usersControllerGetResume(String(userId)),
    enabled: !!userId,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => getFollowStatus(userId),
    enabled: !!currentUser && !isNaN(userId) && userId > 0 && currentUser.id !== userId,
  });

  const followMut = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      message.success(t('social.followDone'));
    },
    onError: (e: Error) => message.error(e.message),
  });

  const unfollowMut = useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      message.success(t('social.unfollowDone'));
    },
    onError: (e: Error) => message.error(e.message),
  });

  const blogs = useMemo(() => blogsData?.list ?? [], [blogsData]);

  // 优先显示昵称，没有则显示用户名
  const displayName = user?.nickname || user?.username;

  // ── 计算成就数据 ─────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      articleCount: blogs.length,
      totalViews: blogs.reduce((s, b) => s + (b.viewCount ?? 0), 0),
      totalLikes: blogs.reduce((s, b) => s + (b.likesCount ?? 0), 0),
      totalFavorites: blogs.reduce((s, b) => s + (b.favoritesCount ?? 0), 0),
    }),
    [blogs],
  );

  const isMe = currentUser?.id === userId;
  const canShowResumeEntry = resumeData?.isResumePublic !== false;
  const bannerGradient = BANNER_GRADIENTS[userId % BANNER_GRADIENTS.length];

  // ── 骨架屏 ───────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="user-home">
        <div className="user-home__banner user-home__banner--skeleton" />
        <div className="user-home__profile-card">
          <div className="profile-card__inner">
            <div className="profile-card__left">
              <Skeleton.Avatar
                active
                size={96}
                className="profile-card__avatar"
              />
              <div className="profile-card__info" style={{ paddingTop: 0 }}>
                <Skeleton
                  active
                  paragraph={{ rows: 2 }}
                  title={{ width: 160 }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="user-home__body">
          <div className="user-home__main">
            <div className="user-home__tabs">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="article-item article-item--skeleton">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="user-home">
      {/* ── Banner ─────────────────────────────────────────── */}
      <div
        className="user-home__banner"
        style={{ background: bannerGradient }}
      />

      {/* ── Profile Card ───────────────────────────────────── */}
      <div className="user-home__profile-card">
        <div className="profile-card__inner">
          <div className="profile-card__left">
            <Avatar
              size={96}
              src={user.avatar}
              icon={<UserOutlined />}
              className="profile-card__avatar"
            />
            <div className="profile-card__info">
              <div className="profile-card__name-row">
                <span className="profile-card__name">{displayName}</span>
                {isMe && (
                  <Tag color="blue" className="profile-card__tag">
                    本人
                  </Tag>
                )}
              </div>
              <p className="profile-card__bio">
                {user.bio || '这个人很懒，什么都没留下~'}
              </p>
              <div className="profile-card__meta">
                <span className="meta-chip">
                  <CalendarOutlined />
                  加入于{' '}
                  {new Date(user.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </span>
                <span className="meta-chip">
                  <FileTextOutlined />
                  {stats.articleCount} 篇文章
                </span>
              </div>
            </div>
          </div>

          <div className="profile-card__actions">
            {isMe ? (
              <>
                {canShowResumeEntry && (
                  <button
                    className="action-btn action-btn--ghost"
                    onClick={() => navigate(`/resume/${userId}`)}
                  >
                    <FileTextOutlined /> 查看简历
                  </button>
                )}
                <button
                  className="action-btn action-btn--ghost"
                  onClick={() => navigate('/profile/edit')}
                >
                  <EditOutlined /> 编辑资料
                </button>
              </>
            ) : (
              <>
                {canShowResumeEntry && (
                  <button
                    className="action-btn action-btn--ghost"
                    onClick={() => navigate(`/resume/${userId}`)}
                  >
                    <FileTextOutlined /> 查看简历
                  </button>
                )}
                {currentUser ? (
                  <button
                    type="button"
                    className="action-btn action-btn--primary"
                    disabled={followMut.isPending || unfollowMut.isPending}
                    onClick={() =>
                      followStatus?.following
                        ? unfollowMut.mutate()
                        : followMut.mutate()
                    }
                  >
                    {followStatus?.following
                      ? t('social.unfollow')
                      : t('social.follow')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="action-btn action-btn--primary"
                    onClick={() => navigate('/login')}
                  >
                    {t('social.follow')}
                  </button>
                )}
                <button
                  type="button"
                  className="action-btn action-btn--ghost"
                  onClick={() => {
                    if (!currentUser) {
                      message.info(t('social.messageLoginTip'));
                      navigate('/login');
                      return;
                    }
                    navigate(`/messages?peer=${userId}`);
                  }}
                >
                  <MessageOutlined /> {t('social.message')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 主体双栏 ─────────────────────────────────────────── */}
      <div className="user-home__body">
        {/* 左侧文章列表 */}
        <div className="user-home__main">
          <Tabs
            defaultActiveKey="articles"
            className="user-home__tabs"
            items={[
              {
                key: 'articles',
                label: (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FileTextOutlined />
                    <span>文章</span>
                    {stats.articleCount > 0 && (
                      <span className="tab-count">{stats.articleCount}</span>
                    )}
                  </span>
                ),
                children: (
                  <div className="article-list">
                    {blogsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="article-item article-item--skeleton"
                        >
                          <Skeleton active paragraph={{ rows: 2 }} />
                        </div>
                      ))
                    ) : blogs.length === 0 ? (
                      <CustomEmpty tip="暂无文章" className="list-empty" />
                    ) : (
                      blogs.map((blog) => (
                        <Link
                          key={blog.id}
                          to={`/blogs/${blog.id}`}
                          className="article-item"
                        >
                          <div className="article-item__body">
                            {blog.tags?.length > 0 && (
                              <div className="article-item__tags">
                                {blog.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="article-tag">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <h3 className="article-item__title">
                              {blog.title}
                            </h3>
                            <p className="article-item__summary">
                              {blog.summary}
                            </p>
                            <div className="article-item__footer">
                              <span className="footer-stat">
                                <EyeOutlined /> {fmtNum(blog.viewCount ?? 0)}
                              </span>
                              <span className="footer-stat">
                                <LikeOutlined /> {fmtNum(blog.likesCount ?? 0)}
                              </span>
                              <span className="footer-stat">
                                <MessageOutlined />{' '}
                                {fmtNum(blog.commentCount ?? 0)}
                              </span>
                              <span className="footer-date">
                                {new Date(blog.createdAt).toLocaleDateString(
                                  'zh-CN',
                                )}
                              </span>
                            </div>
                          </div>
                          {blog.cover && (
                            <div
                              className="article-item__cover"
                              style={getBlogCoverStyle(blog.cover, blog.id)}
                            />
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* 右侧成就侧边栏 */}
        <aside className="user-home__sidebar">
          {/* 个人成就卡片 */}
          <div className="sidebar-card">
            <div className="sidebar-card__title">
              <ThunderboltOutlined className="title-icon title-icon--gold" />
              个人成就
            </div>
            <div className="achievement-list">
              <Tooltip title="所有文章获得的点赞总数">
                <div className="achievement-item">
                  <div className="achievement-item__icon achievement-item__icon--like">
                    <LikeOutlined />
                  </div>
                  <div className="achievement-item__info">
                    <div className="achievement-item__label">获得点赞</div>
                    <div className="achievement-item__value">
                      {fmtNum(stats.totalLikes)}
                    </div>
                  </div>
                </div>
              </Tooltip>
              <Divider style={{ margin: '10px 0' }} />
              <Tooltip title="所有文章的阅读量总和">
                <div className="achievement-item">
                  <div className="achievement-item__icon achievement-item__icon--view">
                    <EyeOutlined />
                  </div>
                  <div className="achievement-item__info">
                    <div className="achievement-item__label">文章被阅读</div>
                    <div className="achievement-item__value">
                      {fmtNum(stats.totalViews)}
                    </div>
                  </div>
                </div>
              </Tooltip>
              <Divider style={{ margin: '10px 0' }} />
              <Tooltip title="所有文章获得的收藏总数">
                <div className="achievement-item">
                  <div className="achievement-item__icon achievement-item__icon--star">
                    <StarOutlined />
                  </div>
                  <div className="achievement-item__info">
                    <div className="achievement-item__label">获得收藏</div>
                    <div className="achievement-item__value">
                      {fmtNum(stats.totalFavorites)}
                    </div>
                  </div>
                </div>
              </Tooltip>
            </div>
          </div>

          {/* 最近发布 */}
          {blogs.length > 0 && (
            <div className="sidebar-card">
              <div className="sidebar-card__title">最近发布</div>
              <div className="recent-list">
                {blogs.slice(0, 5).map((blog) => (
                  <Link
                    key={blog.id}
                    to={`/blogs/${blog.id}`}
                    className="recent-item"
                  >
                    <span className="recent-item__title">{blog.title}</span>
                    <span className="recent-item__views">
                      <EyeOutlined /> {fmtNum(blog.viewCount ?? 0)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default UserHomePage;
