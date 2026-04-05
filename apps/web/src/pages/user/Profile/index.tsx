import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Tabs, Row, Col, Card, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/reduxHooks';
import { setTheme } from '@/store/themeSlice';
import DataList from '@/components/DataList';
import Loading from '@/components/Loading';
import ActionSheet, { type ActionSheetItem } from '@/components/ActionSheet';
import SkinPicker from '@/components/SkinPicker';
import {
  FileTextOutlined,
  LikeOutlined,
  StarOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  LogoutOutlined,
  RightOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { MyBlogs } from '../../../components/MyBlogs';
import ProfileInfo from '../../../components/ProfileInfo';
import MyFavorites from '../MyFavorites';
import { blogsControllerFindMyBlogs } from '../../../services/generated/blogs/blogs';
import type { BlogDto } from '@services/generated/model';
import {
  getCurrentLocale,
  supportedLanguages,
  type SupportedLocale,
} from '@/i18n';
import { logout } from '@/store/authSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../UserPages.less';

const { TabPane } = Tabs;

const Profile: React.FC = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'blogs';
  const { theme, skin } = useAppSelector((state) => state.theme);
  const currentUser = useAppSelector((state) => state.auth.user);
  const [blogs, setBlogs] = useState<BlogDto[]>([]);
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    stars: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [skinPickerVisible, setSkinPickerVisible] = useState(false);
  const [themeActionSheetVisible, setThemeActionSheetVisible] = useState(false);
  const [languageActionSheetVisible, setLanguageActionSheetVisible] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = (await blogsControllerFindMyBlogs()) as BlogDto[];
      if (Array.isArray(data)) {
        setBlogs(data);
        const totalViews = data.reduce(
          (acc, curr) => acc + (curr.viewCount || 0),
          0,
        );
        const totalLikes = data.reduce(
          (acc, curr) => acc + (curr.likesCount || 0),
          0,
        );
        const totalStars = data.reduce(
          (acc, curr) => acc + (curr.favoritesCount || 0),
          0,
        );
        setStats({
          views: totalViews,
          likes: totalLikes,
          stars: totalStars,
          count: data.length,
        });
      }
    } catch (err) {
      console.error('获取个人成就失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Language menu items
  const languageMenuItems = supportedLanguages.map((lang) => ({
    key: lang.code,
    label: lang.label,
    onClick: () => i18n.changeLanguage(lang.code as SupportedLocale),
  }));

  // Theme menu items
  const themeMenuItems = [
    {
      key: 'light',
      label: '浅色',
      icon: <SunOutlined />,
      onClick: () => dispatch(setTheme('light')),
    },
    {
      key: 'dark',
      label: '深色',
      icon: <MoonOutlined />,
      onClick: () => dispatch(setTheme('dark')),
    },
    {
      key: 'system',
      label: '跟随系统',
      icon: <DesktopOutlined />,
      onClick: () => dispatch(setTheme('system')),
    },
  ];

  // Theme ActionSheet items
  const themeActionSheetItems: ActionSheetItem[] = themeMenuItems.map((item) => ({
    key: item.key,
    title: item.label,
    icon: item.icon,
    onClick: item.onClick,
  }));

  // Language ActionSheet items
  const languageActionSheetItems: ActionSheetItem[] = languageMenuItems.map((item) => ({
    key: item.key,
    title: item.label,
    onClick: item.onClick,
  }));

  // Get current theme icon
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const mobileSettingsItems = [
    // 文章入口
    {
      key: 'blogs',
      icon: <FileTextOutlined />,
      label: '我的文章',
      value: `${stats.count}篇`,
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => navigate('/profile?tab=blogs'),
    },
    // 收藏入口
    {
      key: 'favorites',
      icon: <StarOutlined />,
      label: '我的收藏',
      value: '',
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => navigate('/favorites'),
    },
    // 简历入口
    {
      key: 'resume',
      icon: <EyeOutlined />,
      label: '查看简历',
      value: '',
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => {
        if (currentUser?.id) {
          navigate(`/resume/${currentUser.id}`);
        }
      },
    },
    {
      key: 'resume-edit',
      icon: <FileTextOutlined />,
      label: '编辑简历',
      value: '',
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => navigate('/profile/resume'),
    },
    // 写文章
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: '写文章',
      value: '',
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => navigate('/create'),
    },
    // 主题
    {
      key: 'theme',
      icon: getThemeIcon(),
      label: '主题',
      value:
        theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统',
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => setThemeActionSheetVisible(true),
    },
    // 皮肤
    {
      key: 'skin',
      icon: (
        <div
          className="skin-color-dot"
          style={{ background: `var(--skin-primary)` }}
        />
      ),
      label: '皮肤',
      value: skin,
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => setSkinPickerVisible(true),
    },
    // 语言
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: '语言',
      value:
        supportedLanguages.find((l) => l.code === getCurrentLocale())?.label ||
        '中文',
      action: <RightOutlined className="setting-arrow" />,
      onClick: () => setLanguageActionSheetVisible(true),
    },
    // 退出登录
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      value: '',
      action: null,
      isDanger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="profile-page-container">
      {/* 个人简介 */}
      <ProfileInfo />

      {/* 移动端设置面板 */}
      <div className="mobile-settings-panel show-mobile-block">
        <DataList
          className="profile-mobile-settings-list"
          dataSource={mobileSettingsItems}
          rowKey={(item) => item.key}
          listRole={false}
          itemRole={false}
          rowClassName={(item) =>
            classNames('settings-item', { danger: item.isDanger })
          }
          rowProps={(item) => ({
            onClick: item.onClick,
            role: 'button',
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.onClick();
              }
            },
          })}
          renderItem={(item) => (
            <>
              <div className="settings-item-left">
                <span className="settings-icon">{item.icon}</span>
                <span className="settings-label">{item.label}</span>
              </div>
              <div className="settings-item-right">
                <span className="settings-value">{item.value}</span>
                {item.action}
              </div>
            </>
          )}
        />

        {/* 主题选择半弹窗 */}
        <ActionSheet
          visible={themeActionSheetVisible}
          onClose={() => setThemeActionSheetVisible(false)}
          title="选择主题"
          items={themeActionSheetItems.map((item) => ({
            ...item,
            badge: theme === item.key ? '✓' : undefined,
          }))}
        />

        {/* 语言选择半弹窗 */}
        <ActionSheet
          visible={languageActionSheetVisible}
          onClose={() => setLanguageActionSheetVisible(false)}
          title="选择语言"
          items={languageActionSheetItems.map((item) => ({
            ...item,
            badge: getCurrentLocale() === item.key ? '✓' : undefined,
          }))}
        />
      </div>

      <Row gutter={20} className="profile-body-row">
        {/* 左侧主要内容区 */}
        <Col xs={24} sm={24} md={17} lg={18} className="profile-main-content">
          <div className="profile-content-tabs">
            <Tabs
              defaultActiveKey={activeTab}
              activeKey={activeTab}
              onChange={(key) => navigate(`/profile?tab=${key}`)}
              size="large"
            >
              <TabPane
                tab={
                  <span>
                    <FileTextOutlined />
                    文章 {stats.count > 0 ? stats.count : ''}
                  </span>
                }
                key="blogs"
              >
                <div className="tab-content-wrapper">
                  <MyBlogs
                    blogs={blogs}
                    loading={loading}
                    onRefresh={fetchStats}
                  />
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <StarOutlined />
                    我的收藏
                  </span>
                }
                key="favorites"
              >
                <div className="tab-content-wrapper">
                  <MyFavorites />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </Col>

        {/* 右侧边栏 - 个人成就 */}
        <Col xs={0} sm={0} md={7} lg={6} className="profile-sidebar">
          <Card
            title={
              <div className="card-title">
                <ThunderboltOutlined
                  style={{ color: '#ffb100', marginRight: 8 }}
                />
                个人成就
              </div>
            }
            variant="borderless"
            className="achievement-card"
          >
            <div className="achievement-list">
              <div className="achievement-item">
                <div className="icon-box">
                  <LikeOutlined />
                </div>
                <div className="info">
                  <div className="label">获得点赞</div>
                  <div className="count">
                    {loading ? <Loading size="small" /> : stats.likes}
                  </div>
                </div>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="achievement-item">
                <div className="icon-box" style={{ color: '#1e80ff' }}>
                  <EyeOutlined />
                </div>
                <div className="info">
                  <div className="label">文章被阅读</div>
                  <div className="count">
                    {loading ? <Loading size="small" /> : stats.views}
                  </div>
                </div>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="achievement-item">
                <div className="icon-box" style={{ color: '#ffb100' }}>
                  <StarOutlined />
                </div>
                <div className="info">
                  <div className="label">获得收藏</div>
                  <div className="count">
                    {loading ? <Loading size="small" /> : stats.stars}
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />
            </div>
          </Card>

          <Card variant="borderless" className="follow-stats-card">
            <div className="follow-list">
              <div className="follow-item">
                <div className="label">关注了</div>
                <div className="count">0</div>
              </div>
              <Divider
                type="vertical"
                style={{ height: '24px', margin: '0 20px' }}
              />
              <div className="follow-item">
                <div className="label">关注者</div>
                <div className="count">0</div>
              </div>
            </div>
          </Card>

          <div className="profile-sidebar-footer">
            <Divider />
            <div className="footer-links">
              <span>关于我们</span> · <span>加入我们</span> ·{' '}
              <span>隐私政策</span>
            </div>
            <div className="copyright">© 2025 ABNER的博客</div>
          </div>
        </Col>
      </Row>
      <SkinPicker
        visible={skinPickerVisible}
        onClose={() => setSkinPickerVisible(false)}
      />
    </div>
  );
};

export default Profile;
