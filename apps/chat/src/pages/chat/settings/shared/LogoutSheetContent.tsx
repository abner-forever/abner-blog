import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/reduxHooks';
import { logout } from '@/store/authSlice';

interface Props {
  onCancel: () => void;
}

const LogoutSheetContent: React.FC<Props> = ({ onCancel }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduxDispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    reduxDispatch(logout());
    navigate('/chat', { replace: true });
  };

  return (
    <div className="logout-sheet-content">
      <div className="sub-sheet-avatar-section">
        <Avatar size={72} icon={<UserOutlined />} src={user?.avatar}>
          {user?.nickname?.[0]?.toUpperCase()}
        </Avatar>
      </div>

      <div className="logout-sheet-content__message">
        <div className="logout-sheet-content__title">
          {t('chat.logoutConfirm')}
        </div>
        <div className="logout-sheet-content__desc">
          {t('chat.logoutConfirmHint')}
        </div>
      </div>

      <div className="logout-sheet-content__actions">
        <Button
          block
          size="large"
          onClick={onCancel}
          className="logout-sheet-content__cancel"
        >
          {t('common.cancel')}
        </Button>
        <Button
          block
          size="large"
          danger
          type="primary"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          className="logout-sheet-content__confirm"
        >
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
};

export default LogoutSheetContent;
