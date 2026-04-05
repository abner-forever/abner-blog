import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BlogDto } from '@services/generated/model';
import { Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import Loading from '@/components/Loading';
import CustomEmpty from '@/components/CustomEmpty';
import { EyeOutlined, LikeOutlined, StarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import {
  userFavoritesControllerGetUserFavorites,
  favoritesControllerToggleFavorite,
} from '@services/generated/favorites/favorites';
import '../UserPages.less';
import '@/pages/blog/BlogList/index.less';

const MyFavorites: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['userFavorites'],
    queryFn: async () => {
      const data =
        (await userFavoritesControllerGetUserFavorites()) as BlogDto[];
      return Array.isArray(data) ? data : [];
    },
  });

  const removeMutation = useMutation({
    mutationFn: (blogId: number) =>
      favoritesControllerToggleFavorite(blogId.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites'] });
      message.success(t('favorites.unfavorSuccess'));
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });

  const handleFavorite = (e: React.MouseEvent, blogId: number) => {
    e.stopPropagation();
    removeMutation.mutate(blogId);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="profile-page-container favorites-page">
      <div className="favorites-list">
        {favorites.length === 0 ? (
          <CustomEmpty tip={t('favorites.empty')}>
            <Link to="/">
              <Button type="primary" shape="round">
                {t('favorites.discover')}
              </Button>
            </Link>
          </CustomEmpty>
        ) : (
          favorites.map((blog) => (
            <div
              key={blog.id}
              className="favorite-item"
              onClick={() => navigate(`/blogs/${blog.id}`)}
            >
              <div className="favorite-content">
                <div className="favorite-meta">
                  <span className="author">
                    {blog.author?.nickname ||
                      blog.author?.username ||
                      t('common.anonymous')}
                  </span>
                  <span className="divider">·</span>
                  <span className="date">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link to={`/blogs/${blog.id}`} className="favorite-title">
                  {blog.title}
                </Link>
                <div className="favorite-stats">
                  <span>
                    <EyeOutlined /> {blog.viewCount || 0}
                  </span>
                  <span>
                    <LikeOutlined /> {blog.likesCount || 0}
                  </span>
                </div>
              </div>
              <div
                className="favorite-action"
                onClick={(e) => handleFavorite(e, blog.id)}
              >
                <StarOutlined /> 取消
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyFavorites;
