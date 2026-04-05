import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Tag, Space, Button, message, Image } from 'antd';
import Loading from '@/components/Loading';
import CustomEmpty from '@/components/CustomEmpty';
import {
  LikeOutlined,
  LikeFilled,
  StarOutlined,
  StarFilled,
  CommentOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  momentsControllerFindOne,
  momentsControllerToggleLike,
  momentsControllerToggleFavorite,
} from '@services/generated/moments/moments';
import { CommentSection } from '@/components/CommentSection';
import { formatDistanceToNow } from '@utils/date';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import type { MomentDto } from '@services/generated/model';
import './index.less';

type MomentDtoWithFavoriteCount = MomentDto & { favoriteCount?: number };

const MomentDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { checkAuth } = useAuthCheck();

  const [moment, setMoment] = useState<MomentDtoWithFavoriteCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fetchMomentDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = (await momentsControllerFindOne(id)) as MomentDto;
      setMoment(data);
    } catch {
      message.error(t('moment.getDetailFailed'));
      navigate('/moments');
    } finally {
      setLoading(false);
    }
  }, [id, t, navigate]);

  useEffect(() => {
    if (!id) return;
    void fetchMomentDetail();
  }, [id, fetchMomentDetail]);

  const handleLike = async () => {
    if (!moment || likeLoading) return;

    // 检查登录状态
    if (!checkAuth()) return;

    setLikeLoading(true);
    try {
      const { isLiked } = (await momentsControllerToggleLike(
        String(moment.id),
      )) as { isLiked: boolean };
      setMoment({
        ...moment,
        isLiked,
        likeCount: isLiked ? moment.likeCount + 1 : moment.likeCount - 1,
      });
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 401) {
        message.warning(t('common.pleaseLoginFirst'));
        return;
      }
      message.error(t('common.error'));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!moment || favoriteLoading) return;

    // 检查登录状态
    if (!checkAuth()) return;

    setFavoriteLoading(true);
    try {
      const { isFavorited } = (await momentsControllerToggleFavorite(
        String(moment.id),
      )) as { isFavorited: boolean };
      setMoment({
        ...moment,
        isFavorited,
        favoriteCount: (() => {
          const prev = moment.favoriteCount ?? 0;
          return isFavorited ? prev + 1 : Math.max(0, prev - 1);
        })(),
      });
      message.success(
        isFavorited ? t('moment.favorited') : t('moment.unfavorSuccess'),
      );
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 401) {
        message.warning(t('common.pleaseLoginFirst'));
        return;
      }
      message.error(t('common.error'));
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="moment-detail-loading">
        <Loading page />
      </div>
    );
  }

  if (!moment) {
    return (
      <div className="moment-detail-empty">
        <CustomEmpty tip={t('moment.empty')} />
      </div>
    );
  }

  return (
    <div className="moment-detail-page">
      <div className="moment-detail-container">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/moments')}
          className="back-btn"
        >
          {t('common.back')}
        </Button>

        <Card className="moment-card">
          <div className="moment-header">
            <div className="author-info">
              <Avatar src={moment.author.avatar} size={48}>
                {(moment.author.nickname || moment.author.username)[0]}
              </Avatar>
              <div className="author-details">
                <div className="author-name">
                  {moment.author.nickname || moment.author.username}
                </div>
                <div className="moment-time">
                  {formatDistanceToNow(new Date(moment.createdAt))}
                </div>
              </div>
            </div>
          </div>

          <div className="moment-content">
            <p className="moment-text">{moment.content}</p>
            {moment.images && moment.images.length > 0 && (
              <div className="moment-images">
                <Image.PreviewGroup>
                  {moment.images.map((img, index) => (
                    <Image key={index} src={img} alt="" />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}
          </div>

          {moment.topic && (
            <div className="moment-topic">
              <Tag color="blue">#{moment.topic.name}</Tag>
            </div>
          )}

          <div className="moment-stats">
            <Space size={24}>
              <span className="stat-item">
                <EyeOutlined />
                <span>{moment.viewCount} 浏览</span>
              </span>
              <span className="stat-item">
                <CommentOutlined />
                <span>{moment.commentCount} 评论</span>
              </span>
            </Space>
          </div>

          <div className="moment-actions">
            <Space size={16}>
              <Button
                type={moment.isLiked ? 'primary' : 'default'}
                icon={moment.isLiked ? <LikeFilled /> : <LikeOutlined />}
                onClick={handleLike}
                loading={likeLoading}
              >
                {moment.isLiked ? t('moment.liked') : t('moment.like')}{' '}
                {moment.likeCount > 0 && `(${moment.likeCount})`}
              </Button>
              <Button
                type={moment.isFavorited ? 'primary' : 'default'}
                icon={moment.isFavorited ? <StarFilled /> : <StarOutlined />}
                onClick={handleFavorite}
                loading={favoriteLoading}
              >
                {moment.isFavorited
                  ? t('moment.favorited')
                  : t('moment.favorite')}{' '}
                {(moment.favoriteCount ?? 0) > 0 &&
                  `(${moment.favoriteCount ?? 0})`}
              </Button>
            </Space>
          </div>
        </Card>

        <Card
          className="comment-section"
          title={t('moment.comment')}
          bordered={false}
        >
          <CommentSection
            resourceType="moment"
            resourceId={moment.id}
            onCommentAdded={() => fetchMomentDetail()}
            onCommentDeleted={() => fetchMomentDetail()}
          />
        </Card>
      </div>
    </div>
  );
};

export default MomentDetail;
