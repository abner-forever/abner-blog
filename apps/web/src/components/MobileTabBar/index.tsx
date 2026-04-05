import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/store';
import './index.less';

interface TabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const MobileTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { token } = useSelector((state: RootState) => state.auth);

  const tabs: TabItem[] = [
    { key: 'home', icon: <HomeOutlined />, label: t('nav.home'), path: '/' },
    {
      key: 'blog',
      icon: <FileTextOutlined />,
      label: t('nav.blogs'),
      path: '/blogs',
    },
    {
      key: 'notes',
      icon: <EditOutlined />,
      label: t('nav.notes'),
      path: '/notes',
    },
    {
      key: 'todo',
      icon: <CalendarOutlined />,
      label: t('nav.todos'),
      path: '/todos',
    },
    {
      key: 'my',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      path: token ? '/profile' : '/login?returnUrl=/profile',
    },
  ];

  const handleTabClick = (tab: TabItem) => {
    navigate(tab.path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 移动端才显示底部导航
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
  }

  return (
    <div className="mobile-tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={`tab-item ${isActive(tab.path) ? 'active' : ''}`}
          onClick={() => handleTabClick(tab)}
        >
          <div className="tab-icon">{tab.icon}</div>
          <div className="tab-label">{tab.label}</div>
        </div>
      ))}
    </div>
  );
};

export default MobileTabBar;
