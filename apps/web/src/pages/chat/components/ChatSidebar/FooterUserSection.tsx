import React, { memo, useCallback, useMemo } from 'react';
import { Button, Dropdown, Avatar, Switch } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { useAppSelector, useAppDispatch } from '@/store/reduxHooks';
import { setTheme } from '@/store/themeSlice';
import './FooterUserSection.less';

const FooterUserSection: React.FC = memo(function FooterUserSection() {
  const { t } = useTranslation();
  const { dispatch } = useChat();
  const theme = useAppSelector((s) => s.theme.theme);
  const user = useAppSelector((s) => s.auth.user);

  const dispatchTheme = useAppDispatch();

  const handleThemeChange = useCallback((checked: boolean) => {
    dispatchTheme(setTheme(checked ? 'dark' : 'light'));
  }, [dispatchTheme]);

  const userMenuItems: MenuProps['items'] = useMemo(() => [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => {
        window.location.href = '/profile';
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('chat.settings'),
      onClick: () => {
        dispatch({ type: 'SET_SHOW_CHAT_SETTINGS', payload: true });
      },
    },
    { type: 'divider' },
    {
      key: 'theme',
      icon: theme === 'dark' ? <SunOutlined /> : <MoonOutlined />,
      label: (
        <div className="theme-toggle-item">
          <span>{theme === 'dark' ? t('nav.theme.light') : t('nav.theme.dark')}</span>
          <Switch size="small" checked={theme === 'dark'} onChange={handleThemeChange} />
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      danger: true,
      onClick: () => {
        window.location.href = '/login';
      },
    },
  ], [t, theme, dispatch, handleThemeChange]);

  return (
    <div className="footer-user-section">
      <Dropdown
        menu={{ items: userMenuItems }}
        trigger={['click']}
        placement="topLeft"
        overlayClassName="user-dropdown-overlay"
      >
        <Button type="text" className="footer-user-btn">
          <Avatar
            size={24}
            src={user?.avatar}
            icon={<UserOutlined />}
            className="footer-user-avatar"
          />
          <span className="footer-user-name">
            {user?.username || user?.nickname || '游客'}
          </span>
        </Button>
      </Dropdown>
    </div>
  );
});

export default FooterUserSection;
