import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Badge,
  Dropdown,
  Input,
  Button,
  Space,
  Grid,
  Drawer,
  Popover,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  EditOutlined,
  DesktopOutlined,
  MoonOutlined,
  SunOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  BellOutlined,
  MessageOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '@/store/authSlice';
import { setTheme } from '@/store/themeSlice';
import type { RootState } from '../../store';
import {
  supportedLanguages,
  getCurrentLocale,
  type SupportedLocale,
} from '@/i18n';
import SkinPicker from '../SkinPicker';
import {
  getDmUnreadCount,
  getNotificationFeedUnreadCount,
} from '@services/social';
import { getSiteBrand } from '@/config/site';
import './index.less';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const siteTitle = getSiteBrand(getCurrentLocale()).title;
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useSelector((state: RootState) => state.theme);
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = React.useState('');
  const [skinPickerVisible, setSkinPickerVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchPopoverOpen, setSearchPopoverOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  /** 与 antd lg 一致：≥992px 使用横向导航；未就绪时按桌面处理避免闪动 */
  const isLgUp = screens.lg ?? true;
  const isMdUp = screens.md ?? true;

  // 进入搜索页时将 URL 中的关键词同步到输入框
  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchValue(searchParams.get('q') || '');
    }
  }, [location.pathname, searchParams]);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}&tab=all`);
      setSearchPopoverOpen(false);
    }
  };

  const menuItems = [
    { key: '/', label: t('nav.home') },
    { key: '/blogs', label: t('nav.blogs') },
    { key: '/moments', label: t('nav.moments') },
    { key: '/notes', label: t('nav.notes') },
    { key: '/news', label: t('nav.news') },
    { key: '/chat', label: t('nav.chat') },
    { key: '/tools', label: t('nav.tools') },
    { key: '/todos', label: t('nav.todos') },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: () => {
        dispatch(logout());
        navigate('/login');
      },
    },
  ];

  const themeMenuItems = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: t('nav.theme.light'),
      onClick: () => dispatch(setTheme('light')),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: t('nav.theme.dark'),
      onClick: () => dispatch(setTheme('dark')),
    },
    {
      key: 'system',
      icon: <DesktopOutlined />,
      label: t('nav.theme.system'),
      onClick: () => dispatch(setTheme('system')),
    },
    { type: 'divider' as const },
    {
      key: 'skin',
      icon: <BgColorsOutlined />,
      label: '🎨 主题皮肤',
      onClick: () => setSkinPickerVisible(true),
    },
  ];

  const languageMenuItems = supportedLanguages.map((lang) => ({
    key: lang.code,
    label: lang.label,
    onClick: () => i18n.changeLanguage(lang.code as SupportedLocale),
  }));

  const { data: feedUnreadData } = useQuery({
    queryKey: ['social', 'feed-unread'],
    queryFn: getNotificationFeedUnreadCount,
    enabled: !!user,
    staleTime: 20_000,
  });
  const { data: dmUnreadData } = useQuery({
    queryKey: ['social', 'dm-unread'],
    queryFn: getDmUnreadCount,
    enabled: !!user,
    staleTime: 8_000,
    refetchOnWindowFocus: true,
  });
  const feedUnread = feedUnreadData?.feedUnread ?? 0;
  const dmUnread = dmUnreadData?.dmUnread ?? 0;

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      default:
        return <DesktopOutlined />;
    }
  };

  const searchInput = (
    <Input
      placeholder={t('nav.searchPlaceholder')}
      prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
      className="navbar-search"
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      onPressEnter={() => handleSearch(searchValue)}
    />
  );

  return (
    <>
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            {!isLgUp && (
              <Button
                type="text"
                className="navbar__menu-trigger"
                icon={<MenuOutlined />}
                aria-label={t('nav.menu')}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <Link
              to="/"
              className="logo"
              aria-label={!isLgUp ? siteTitle : undefined}
              title={!isLgUp ? siteTitle : undefined}
            >
              <div className="logo-badge">
                <span className="logo-letter">A</span>
                <div className="logo-accent"></div>
              </div>
              <span className="logo-text">{siteTitle}</span>
            </Link>
            {isLgUp && (
              <nav className="nav-menu">
                {menuItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.key}
                    className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="navbar-right">
            {isLgUp ? (
              <div className="search-box">{searchInput}</div>
            ) : (
              <Popover
                open={searchPopoverOpen}
                onOpenChange={setSearchPopoverOpen}
                trigger="click"
                placement="bottomRight"
                destroyOnHidden
                content={
                  <div className="navbar__search-popover">
                    {searchInput}
                    <Button
                      type="primary"
                      block
                      icon={<SearchOutlined />}
                      onClick={() => handleSearch(searchValue)}
                    >
                      {t('nav.searchAction')}
                    </Button>
                  </div>
                }
              >
                <button
                  type="button"
                  className="nav-icon-btn navbar__search-icon"
                  title={t('nav.searchAction')}
                  aria-label={t('nav.searchAction')}
                >
                  <SearchOutlined />
                </button>
              </Popover>
            )}

            <Link to="/create">
              <Button
                type="primary"
                icon={<EditOutlined />}
                className="create-btn"
                aria-label={t('nav.create')}
              >
                {isMdUp ? t('nav.create') : undefined}
              </Button>
            </Link>

            <Space size={16} style={{ marginLeft: 8 }}>
              <Dropdown
                menu={{
                  items: languageMenuItems,
                  selectedKeys: [getCurrentLocale()],
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="nav-icon-btn" title={t('nav.language')}>
                  <GlobalOutlined />
                </div>
              </Dropdown>
              <Dropdown
                menu={{ items: themeMenuItems, selectedKeys: [theme] }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="nav-icon-btn theme-toggle">
                  {getThemeIcon()}
                </div>
              </Dropdown>

              {user ? (
                <div className="user-section">
                  <Badge
                    count={feedUnread}
                    size="small"
                    offset={[-2, 2]}
                    overflowCount={99}
                    className="navbar__badge-wrap"
                  >
                    <Link
                      to="/notifications"
                      className="nav-icon-btn"
                      title={
                        feedUnread > 0
                          ? `${t('nav.notifications')} (${feedUnread})`
                          : t('nav.notifications')
                      }
                      aria-label={
                        feedUnread > 0
                          ? `${t('nav.notifications')}, ${t('social.unreadCount', { count: feedUnread })}`
                          : t('nav.notifications')
                      }
                    >
                      <BellOutlined />
                    </Link>
                  </Badge>
                  <Badge
                    count={dmUnread}
                    size="small"
                    offset={[-2, 2]}
                    overflowCount={99}
                    className="navbar__badge-wrap"
                  >
                    <Link
                      to="/messages"
                      className="nav-icon-btn"
                      title={
                        dmUnread > 0
                          ? `${t('nav.messages')} (${dmUnread})`
                          : t('nav.messages')
                      }
                      aria-label={
                        dmUnread > 0
                          ? `${t('nav.messages')}, ${t('social.unreadCount', { count: dmUnread })}`
                          : t('nav.messages')
                      }
                    >
                      <MessageOutlined />
                    </Link>
                  </Badge>
                  <Dropdown
                    menu={{ items: userMenuItems }}
                    placement="bottomRight"
                  >
                    <Avatar
                      src={user.avatar}
                      icon={<UserOutlined />}
                      className="user-avatar"
                    />
                  </Dropdown>
                </div>
              ) : (
                <div className="auth-btns">
                  <Button
                    type="link"
                    onClick={() => navigate('/login')}
                    className="login-btn"
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    type="primary"
                    ghost
                    onClick={() => navigate('/register')}
                    className="register-btn"
                  >
                    {t('nav.register')}
                  </Button>
                </div>
              )}
            </Space>
          </div>
        </div>
      </div>
      <Drawer
        title={t('nav.menu')}
        placement="left"
        width={280}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        classNames={{ body: 'navbar__drawer-body' }}
      >
        <nav className="navbar__drawer-nav">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={item.key}
              className={`navbar__drawer-link ${location.pathname === item.key ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
      <SkinPicker
        visible={skinPickerVisible}
        onClose={() => setSkinPickerVisible(false)}
      />
    </>
  );
};

export default Navbar;
