import React from 'react';
import { Avatar, message, Popconfirm, Tooltip } from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './index.less';

interface CommentItemProps {
  comment: {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    isEdited?: boolean;
    author: {
      id: number;
      username: string;
      nickname?: string | null;
      avatar?: string | null;
    };
    likeCount?: number;
    isLiked?: boolean;
    replyToUser?: {
      id: number;
      username: string;
      nickname?: string | null;
    };
  };
  onLike: () => Promise<void>;
  onReply: () => void;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
  variant?: 'root' | 'reply';
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  onDelete,
  canDelete,
  variant = 'root',
}) => {
  const { t } = useTranslation();

  const handleLike = async () => {
    try {
      await onLike();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return t('common.unknownTime');
    }
  };

  // 优先显示昵称，没有则显示用户名
  const authorName = comment.author.nickname || comment.author.username;
  const replyToUserName =
    comment.replyToUser?.nickname || comment.replyToUser?.username;

  return (
    <div
      className={`comment-item ${variant === 'reply' ? 'is-reply' : 'is-root'}`}
    >
      <div className="comment-item-main">
        <div className="comment-avatar">
          <Avatar
            src={comment.author.avatar}
            size={variant === 'reply' ? 32 : 36}
            alt={authorName}
          >
            {authorName[0]}
          </Avatar>
        </div>

        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{authorName}</span>
            <span className="comment-time">
              {formatTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="comment-edited">(已编辑)</span>
            )}
          </div>

          <div className="comment-content-wrapper">
            {variant === 'reply' && comment.replyToUser && (
              <div className="reply-target">
                回复 <span className="reply-user">@{replyToUserName}</span>
              </div>
            )}
            <div className="comment-content">{comment.content}</div>
          </div>

          <div className="comment-actions">
            <Tooltip title={comment.likeCount || 0}>
              <button
                className={`action-btn ${comment.isLiked ? 'active' : ''}`}
                onClick={handleLike}
                type="button"
              >
                {comment.isLiked ? (
                  <LikeFilled className="like-icon" />
                ) : (
                  <LikeOutlined className="like-icon" />
                )}
                <span className="action-text">
                  {comment.likeCount && comment.likeCount > 0
                    ? comment.likeCount
                    : '赞'}
                </span>
              </button>
            </Tooltip>
            <button className="action-btn" onClick={onReply} type="button">
              <MessageOutlined className="reply-icon" />
              <span className="action-text">{t('comment.reply')}</span>
            </button>
            {canDelete && (
              <Popconfirm
                title={t('comment.deleteConfirmTitle')}
                onConfirm={handleDelete}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
              >
                <button className="action-btn delete" type="button">
                  <DeleteOutlined />
                  <span className="action-text">{t('common.delete')}</span>
                </button>
              </Popconfirm>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { CommentItem };
