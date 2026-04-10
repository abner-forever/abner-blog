import React, { memo } from 'react';
import { Button, Dropdown, Avatar, Switch, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  RobotOutlined,
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
import './SidebarFooter.less';

const SidebarFooter: React.FC = memo(function SidebarFooter() {
  const { t } = useTranslation();
  const { state, dispatch } = useChat();
  const { showKnowledgeBase, showMCPServer, showSkill } = state;

  // Theme
  const theme = useAppSelector((s) => s.theme.theme);
  const dispatchTheme = useAppDispatch();

  // User info
  const user = useAppSelector((s) => s.auth.user);

  const handleToggleKnowledgeBase = () => {
    dispatch({ type: 'SET_SHOW_KNOWLEDGE_BASE', payload: !showKnowledgeBase });
  };

  const handleToggleMCPServer = () => {
    dispatch({ type: 'SET_SHOW_MCP_SERVER', payload: !showMCPServer });
  };

  const handleToggleSkill = () => {
    dispatch({ type: 'SET_SHOW_SKILL', payload: !showSkill });
  };

  const handleThemeChange = (checked: boolean) => {
    dispatchTheme(setTheme(checked ? 'dark' : 'light'));
  };

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
          <span>
            {theme === 'dark' ? t('nav.theme.light') : t('nav.theme.dark')}
          </span>
          <Switch
            size="small"
            checked={theme === 'dark'}
            onChange={handleThemeChange}
          />
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
  ];

  return (
    <div className="sidebar-footer">
      <div className="sidebar-footer-divider" />
      <div className="sidebar-footer-buttons">
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="topLeft"
          overlayClassName="user-dropdown-overlay"
        >
          <Button type="text" className="sidebar-user-btn">
            <Avatar
              size={24}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="user-avatar"
            />
            <span className="user-name">
              {user?.username || user?.nickname || '游客'}
            </span>
          </Button>
        </Dropdown>

        <Tooltip title="知识库" placement="right">
          <Button
            type={showKnowledgeBase ? 'primary' : 'text'}
            icon={<DatabaseOutlined />}
            onClick={handleToggleKnowledgeBase}
            className={`sidebar-footer-btn ${showKnowledgeBase ? 'active' : ''}`}
          >
            <span>知识库</span>
          </Button>
        </Tooltip>
        <Tooltip title="MCP 服务器" placement="right">
          <Button
            type={showMCPServer ? 'primary' : 'text'}
            icon={<ApiOutlined />}
            onClick={handleToggleMCPServer}
            className={`sidebar-footer-btn ${showMCPServer ? 'active' : ''}`}
          >
            <span>MCP</span>
          </Button>
        </Tooltip>
        <Tooltip title="技能市场" placement="right">
          <Button
            type={showSkill ? 'primary' : 'text'}
            icon={<RobotOutlined />}
            onClick={handleToggleSkill}
            className={`sidebar-footer-btn ${showSkill ? 'active' : ''}`}
          >
            <span>技能</span>
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});

export default SidebarFooter;
