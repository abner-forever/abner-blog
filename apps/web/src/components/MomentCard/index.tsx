import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LikeOutlined,
  LikeFilled,
  StarOutlined,
  StarFilled,
  CommentOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { App, Avatar, Image, Tag, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  momentsControllerToggleLike,
  momentsControllerToggleFavorite,
  momentsControllerRemove,
} from '../../services/generated/moments/moments';
import { formatDistanceToNow } from '../../utils/date';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useAuth } from '@/hooks/useAuth';
import type { MomentDto } from '@services/generated/model';
import './index.less';

type MomentDtoWithFavoriteCount = MomentDto & { favoriteCount?: number };

interface MomentCardProps {
  moment: MomentDto;
  onUpdate?: () => void;
  showActions?: boolean;
}

const MomentCard: React.FC<MomentCardProps> = ({
  moment,
  onUpdate,
  showActions = true,
}) => {
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkAuth } = useAuthCheck();
  const { user } = useAuth();
  const [likeLoading, setLikeLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [localMoment, setLocalMoment] = useState<MomentDtoWithFavoriteCount>(
    moment as MomentDtoWithFavoriteCount,
  );
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsOverflowing(el.scrollHeight > el.clientHeight);
    }
  }, [localMoment.content]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeLoading) return;

    // 检查登录状态
    if (!checkAuth()) return;

    setLikeLoading(true);
    try {
      const result = (await momentsControllerToggleLike(
        String(localMoment.id),
      )) as { isLiked: boolean };
      const { isLiked } = result;
      setLocalMoment({
        ...localMoment,
        isLiked,
        likeCount: isLiked
          ? localMoment.likeCount + 1
          : localMoment.likeCount - 1,
      });
      onUpdate?.();
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

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteLoading) return;

    // 检查登录状态
    if (!checkAuth()) return;

    setFavoriteLoading(true);
    try {
      const favoriteResult = (await momentsControllerToggleFavorite(
        String(localMoment.id),
      )) as { isFavorited: boolean };
      const { isFavorited } = favoriteResult;
      const prevFavoriteCount = localMoment.favoriteCount ?? 0;
      setLocalMoment({
        ...localMoment,
        isFavorited,
        favoriteCount: isFavorited
          ? prevFavoriteCount + 1
          : Math.max(0, prevFavoriteCount - 1),
      });
      message.success(
        isFavorited ? t('moment.favorited') : t('moment.unfavorSuccess'),
      );
      onUpdate?.();
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    modal.confirm({
      title: t('moment.deleteConfirmTitle'),
      content: t('moment.deleteConfirmContent'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await momentsControllerRemove(String(localMoment.id));
          message.success(t('moment.deleteSuccess'));
          onUpdate?.();
        } catch {
          message.error(t('moment.deleteFailed'));
        }
      },
    });
  };

  const handleCardClick = () => {
    navigate(`/moments/${localMoment.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/moments/${localMoment.id}/edit`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${localMoment.author.id}`);
  };

  // 优先显示昵称，没有则显示用户名
  const authorName = localMoment.author.nickname || localMoment.author.username;

  return (
    <div className="moment-card" onClick={handleCardClick}>
      <div className="moment-card-header">
        <div className="author-info" onClick={handleAuthorClick}>
          <Avatar src={localMoment.author.avatar} size={40}>
            {authorName[0]}
          </Avatar>
          <div className="author-details">
            <div className="author-name">{authorName}</div>
            <div className="moment-time">
              {formatDistanceToNow(new Date(localMoment.createdAt))}
            </div>
          </div>
        </div>
        {showActions && user?.id === localMoment.author.id && (
          <div className="card-ops">
            <EditOutlined className="edit-btn" onClick={handleEdit} />
            <DeleteOutlined className="delete-btn" onClick={handleDelete} />
          </div>
        )}
      </div>

      <div className="moment-card-content">
        <p className="moment-text" ref={textRef}>
          {localMoment.content}
        </p>
        {isOverflowing && (
          <span
            className="moment-read-more"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/moments/${localMoment.id}`);
            }}
          >
            查看全文
          </span>
        )}
        {localMoment.images && localMoment.images.length > 0 && (
          <div
            className={`moment-images count-${
              localMoment.images.length === 1
                ? '1'
                : localMoment.images.length === 2
                  ? '2'
                  : localMoment.images.length === 3
                    ? '3'
                    : 'many'
            }`}
          >
            <Image.PreviewGroup>
              {localMoment.images.map((img, index) => (
                <Image key={index} src={img} alt="" />
              ))}
            </Image.PreviewGroup>
          </div>
        )}
      </div>

      {localMoment.topic && (
        <div className="moment-topic">
          <Tag color="blue">#{localMoment.topic.name}</Tag>
        </div>
      )}

      <div className="moment-card-footer">
        <div className="moment-stats">
          <Space size={20}>
            <span className="stat-item">
              <EyeOutlined />
              <span className="stat-count">{localMoment.viewCount}</span>
            </span>
            <span className="stat-item">
              <CommentOutlined />
              <span className="stat-count">{localMoment.commentCount}</span>
            </span>
          </Space>
        </div>

        <div className="moment-actions">
          <Space size={16}>
            <button
              className={`action-btn ${localMoment.isLiked ? 'active' : ''}`}
              onClick={handleLike}
              disabled={likeLoading}
            >
              {localMoment.isLiked ? <LikeFilled /> : <LikeOutlined />}
              <span>{localMoment.likeCount > 0 && localMoment.likeCount}</span>
            </button>
            <button
              className={`action-btn ${localMoment.isFavorited ? 'active' : ''}`}
              onClick={handleFavorite}
              disabled={favoriteLoading}
            >
              {localMoment.isFavorited ? <StarFilled /> : <StarOutlined />}
              <span>
                {(localMoment.favoriteCount ?? 0) > 0 &&
                  (localMoment.favoriteCount ?? 0)}
              </span>
            </button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default MomentCard;
