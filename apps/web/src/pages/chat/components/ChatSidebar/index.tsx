import React, { memo, useCallback } from 'react';
import { Button, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { PlusOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { useAppSelector } from '@/store/reduxHooks';
import SidebarSearch from './SidebarSearch';
import SidebarSessionList from './SidebarSessionList';
import SidebarFooter from './SidebarFooter';
import { isMobile } from '@/utils/device';
import './ChatSidebar.less';

const ChatSidebar: React.FC = memo(function ChatSidebar() {
  const { t } = useTranslation();
  const { state, dispatch, createNewSession, switchSession } = useChat();
  const { sidebarCollapsed } = state;
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.theme.theme);

  const handleToggleCollapsed = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !sidebarCollapsed });
  }, [dispatch, sidebarCollapsed]);

  const handleMobileDrawerClose = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_DRAWER_OPEN', payload: false });
  }, [dispatch]);

  const handleSearchResultClick = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      handleMobileDrawerClose();
    },
    [switchSession, handleMobileDrawerClose]
  );

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    },
    [dispatch]
  );

  // User menu items for collapsed state
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => {
        window.location.href = '/profile';
      },
    },
    {
      key: 'theme',
      label: theme === 'dark' ? t('nav.theme.light') : t('nav.theme.dark'),
    },
    {
      key: 'logout',
      label: t('nav.logout'),
      danger: true,
      onClick: () => {
        window.location.href = '/login';
      },
    },
  ];

  if (isMobile()) {
    return (
      <div className={`chat-sidebar mobile-drawer ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewSession}
            block
            className="new-chat-btn"
          >
            新建对话
          </Button>
        </div>
        <SidebarSearch onResultClick={handleSearchResultClick} />
        <SidebarSessionList onDeleteSession={handleDeleteSession} />
        <SidebarFooter />
      </div>
    );
  }

  return (
    <div className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle button */}
      <div className="sidebar-toggle">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleCollapsed}
          className="toggle-btn"
        />
      </div>

      {/* User section when collapsed */}
      {sidebarCollapsed && (
        <div className="sidebar-collapsed-user">
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="topLeft"
            overlayClassName="user-dropdown-overlay"
          >
            <Avatar
              src={user?.avatar}
              icon={<UserOutlined />}
              className="collapsed-user-avatar"
            />
          </Dropdown>
        </div>
      )}

      {/* Full sidebar content */}
      {!sidebarCollapsed && (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createNewSession}
              block
              className="new-chat-btn"
            >
              新建对话
            </Button>
          </div>
          <SidebarSearch onResultClick={handleSearchResultClick} />
          <SidebarSessionList onDeleteSession={handleDeleteSession} />
          <SidebarFooter />
        </div>
      )}
    </div>
  );
});

export default ChatSidebar;