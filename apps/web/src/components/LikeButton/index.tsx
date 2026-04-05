import React from 'react';
import { LikeOutlined, LikeFilled } from '@ant-design/icons';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.less';

interface LikeButtonProps {
  count: number;
  isLiked: boolean;
  onLike: () => Promise<void>;
  loading?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  count,
  isLiked,
  onLike,
  loading = false,
}) => {
  const { t } = useTranslation();

  const handleClick = async () => {
    if (loading) return;

    try {
      await onLike();
    } catch {
      message.error(t('common.error'));
    }
  };

  return (
    <button
      className={`like-button ${isLiked ? 'active' : ''}`}
      onClick={handleClick}
      disabled={loading}
    >
      <span className="icon">
        {isLiked ? <LikeFilled /> : <LikeOutlined />}
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
};

export default LikeButton;
