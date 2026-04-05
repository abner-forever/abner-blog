import React from 'react';
import { StarOutlined, StarFilled } from '@ant-design/icons';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import './index.less';

interface FavoriteButtonProps {
  count: number;
  isFavorited: boolean;
  onFavorite: () => Promise<void>;
  loading?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  count,
  isFavorited,
  onFavorite,
  loading = false,
}) => {
  const { t } = useTranslation();

  const handleClick = async () => {
    if (loading) return;

    try {
      await onFavorite();
    } catch {
      message.error(t('common.error'));
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorited ? 'active' : ''}`}
      onClick={handleClick}
      disabled={loading}
    >
      <span className="icon">
        {isFavorited ? <StarFilled /> : <StarOutlined />}
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
};

export default FavoriteButton;
