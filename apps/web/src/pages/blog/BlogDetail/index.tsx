import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography,
  Divider,
  Alert,
  Avatar,
  Badge,
  message,
  BackTop,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  UserOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  LikeOutlined,
  LikeFilled,
  StarOutlined,
  StarFilled,
  MessageOutlined,
  TagOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { MdPreview } from 'md-editor-rt';
import 'md-editor-rt/lib/preview.css';
import { likesControllerToggleLike } from '@services/generated/likes/likes';
import { favoritesControllerToggleFavorite } from '@services/generated/favorites/favorites';
import { CommentSection } from '@components/CommentSection';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useBlog } from '@/hooks/useBlog';
import { useQueryClient } from '@tanstack/react-query';
import type { BlogDto } from '@services/generated/model';
import { getBlogCoverStyle } from '@/utils/blogCover';
import './index.less';

const { Title } = Typography;

const BlogDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { theme } = useSelector((state: RootState) => state.theme);
  const { checkAuth } = useAuthCheck();
  const queryClient = useQueryClient();
  const { data: blog, error } = useBlog(id || '');

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const updateBlogCache = (patch: Partial<BlogDto>) => {
    queryClient.setQueryData<BlogDto>(['blog', id], (old) => {
      if (!old) return old;
      return { ...old, ...patch };
    });
  };

  const handleLikeToggle = async () => {
    if (!blog) return;
    if (!checkAuth()) return;

    // 乐观更新
    const wasLiked = blog.isLiked;
    updateBlogCache({
      isLiked: !wasLiked,
      likesCount: wasLiked
        ? Math.max(0, (blog.likesCount || 0) - 1)
        : (blog.likesCount || 0) + 1,
    });

    try {
      await likesControllerToggleLike(blog.id.toString());
    } catch (err: unknown) {
      // 回滚
      updateBlogCache({ isLiked: wasLiked, likesCount: blog.likesCount });
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) {
        message.warning(t('common.pleaseLoginFirst'));
      } else {
        message.error(t('common.operationFailed', '操作失败，请重试'));
      }
    }
  };

  const handleFavoriteToggle = async () => {
    if (!blog) return;
    if (!checkAuth()) return;

    // 乐观更新
    const wasFavorited = blog.isFavorited;
    updateBlogCache({
      isFavorited: !wasFavorited,
      favoritesCount: wasFavorited
        ? Math.max(0, (blog.favoritesCount || 0) - 1)
        : (blog.favoritesCount || 0) + 1,
    });

    try {
      await favoritesControllerToggleFavorite(blog.id.toString());
    } catch (err: unknown) {
      // 回滚
      updateBlogCache({
        isFavorited: wasFavorited,
        favoritesCount: blog.favoritesCount,
      });
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) {
        message.warning(t('common.pleaseLoginFirst'));
      } else {
        message.error(t('common.operationFailed', '操作失败，请重试'));
      }
    }
  };

  const scrollToComments = () => {
    const element = document.getElementById('comments-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (error) {
    return (
      <div className="blog-detail-error-wrapper">
        <Alert
          message={t('blog.loadError')}
          description={t('blog.loadFailed')}
          type="error"
          showIcon
        />
        <div style={{ marginTop: 20 }}>
          <Link to="/">{t('blog.backHome')}</Link>
        </div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="blog-detail-container">
      {/* 左侧悬浮操作栏 */}
      <div className="article-suspended-panel">
        <Badge
          count={blog.likesCount || 0}
          overflowCount={999}
          offset={[-2, 32]}
          color="var(--primary-color)"
        >
          <div
            className={`action-item ${blog.isLiked ? 'active' : ''}`}
            onClick={handleLikeToggle}
          >
            {blog.isLiked ? <LikeFilled /> : <LikeOutlined />}
          </div>
        </Badge>

        <Badge
          count={blog.favoritesCount || 0}
          overflowCount={999}
          offset={[-2, 32]}
          color="var(--primary-color)"
        >
          <div
            className={`action-item ${blog.isFavorited ? 'active' : ''}`}
            onClick={handleFavoriteToggle}
          >
            {blog.isFavorited ? <StarFilled /> : <StarOutlined />}
          </div>
        </Badge>

        <div className="action-item" onClick={scrollToComments}>
          <Badge
            count={blog.commentCount || 0}
            overflowCount={999}
            offset={[-2, 32]}
            color="var(--primary-color)"
          >
            <MessageOutlined />
          </Badge>
        </div>
      </div>

      <div className="blog-detail-main">
        <Title className="blog-detail-title">{blog.title}</Title>

        {/* 封面 */}
        <div
          className="blog-detail-cover"
          style={getBlogCoverStyle(blog.cover, blog.id)}
        />

        {/* Meta 信息条 */}
        <div className="blog-detail-meta">
          <Link to={`/user/${blog.author?.id}`} className="meta-author">
            <Avatar
              size={44}
              src={blog.author?.avatar}
              icon={<UserOutlined />}
              className="meta-avatar"
            />
            <div className="meta-author-info">
              <span className="author-name">
                {blog.author?.nickname ||
                  blog.author?.username ||
                  t('common.anonymous')}
              </span>
              <div className="meta-secondary">
                <span className="meta-item">
                  <ClockCircleOutlined />
                  {new Date(blog.createdAt).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="meta-dot">·</span>
                <span className="meta-item">
                  <EyeOutlined />
                  {blog.viewCount || 0} 次阅读
                </span>
                {blog.tags && blog.tags.length > 0 && (
                  <>
                    <span className="meta-dot">·</span>
                    <span className="meta-item meta-tags">
                      <TagOutlined />
                      {blog.tags.slice(0, 3).join(' / ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        </div>

        <Divider className="blog-detail-divider" />

        <div className="blog-detail-content">
          <MdPreview
            editorId="blog-preview"
            modelValue={blog.content}
            theme={isDark ? 'dark' : 'light'}
            previewTheme={(blog.mdTheme as string) || 'default'}
          />
        </div>

        <Divider />

        <div className="blog-detail-tags">
          {blog.tags?.map((tag) => (
            <Link key={tag} to={`/?tag=${tag}`}>
              <span className="tag">{tag}</span>
            </Link>
          ))}
        </div>

        {/* 评论区域 - 放在文章底部 */}
        <div className="blog-detail-comments" id="comments-section">
          <CommentSection resourceType="blog" resourceId={blog.id} />
        </div>
      </div>

      {/* 回到顶部 */}
      <BackTop visibilityHeight={400}>
        <div className="back-top-content">
          <VerticalAlignTopOutlined className="back-top-icon" />
        </div>
      </BackTop>
    </div>
  );
};

export default BlogDetail;
