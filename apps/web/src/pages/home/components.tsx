import { Button, Card, Col, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileTextOutlined,
  MessageOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { BlogDto, MomentDto } from '@services/generated/model';
import type { FC, ReactNode } from 'react';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export interface QuickLinkItem {
  key: string;
  title: string;
  icon: ReactNode;
  path: string;
  color: string;
}

export interface WeatherCardData {
  city: string;
  temp: number;
  tempMax: number;
  tempMin: number;
  weatherText: string;
  weatherEmoji: string;
}

export interface CalendarEventData {
  id: number;
  title: string;
  completed: boolean;
}

interface HeroSectionProps {
  greeting: string;
  currentTime: string;
  welcomeText: string;
  siteNameText: string;
  subtitleText: string;
  browseArticlesText: string;
  aboutMeText: string;
  userLoggedIn: boolean;
  weatherLoading: boolean;
  weatherError: boolean;
  weatherData: WeatherCardData | null;
  eventsLoading: boolean;
  todayEvents: CalendarEventData[];
  onBrowseArticles: () => void;
  onAbout: () => void;
  onLogin: () => void;
}

export const HeroSection: FC<HeroSectionProps> = ({
  greeting,
  currentTime,
  welcomeText,
  siteNameText,
  subtitleText,
  browseArticlesText,
  aboutMeText,
  userLoggedIn,
  weatherLoading,
  weatherError,
  weatherData,
  eventsLoading,
  todayEvents,
  onBrowseArticles,
  onAbout,
  onLogin,
}) => (
  <div className="hero-banner">
    <div className="hero-content">
      <div className="greeting">
        <Text className="greeting-text">{greeting} 👋</Text>
        <Text className="current-time">{currentTime}</Text>
      </div>
      <Title level={1} className="hero-title">
        {welcomeText} <span className="highlight">{siteNameText}</span>
      </Title>
      <Paragraph className="hero-desc">{subtitleText}</Paragraph>
      <Space size="middle" className="hero-actions">
        <Button type="primary" size="large" onClick={onBrowseArticles}>
          <FileTextOutlined /> {browseArticlesText}
        </Button>
        <Button size="large" onClick={onAbout}>
          {aboutMeText} <RightOutlined />
        </Button>
      </Space>
    </div>
    <div className="hero-visual">
      <div className="floating-card card-1">
        <CalendarOutlined className="info-card-icon" />
        <div className="info-card-content">
          <span className="info-card-title">{dayjs().format('M月D日')}</span>
          <span className="info-card-sub">{dayjs().format('dddd')}</span>
        </div>
      </div>

      <div className="floating-card card-2">
        {weatherLoading ? (
          <Spin size="small" />
        ) : weatherError || !weatherData ? (
          <>
            <EnvironmentOutlined className="info-card-icon" />
            <div className="info-card-content">
              <span className="info-card-title">天气未知</span>
              <span className="info-card-sub">网络异常</span>
            </div>
          </>
        ) : (
          <div className="weather-content">
            <div className="weather-left">
              <span className="weather-emoji">{weatherData.weatherEmoji}</span>
              <div className="weather-temp">
                <span className="temp-current">{weatherData.temp}°</span>
                <span className="temp-range">
                  {weatherData.tempMin}° ~ {weatherData.tempMax}°
                </span>
              </div>
            </div>
            <div className="weather-right">
              <span className="weather-status">{weatherData.weatherText}</span>
              <span className="weather-city">
                <EnvironmentOutlined /> {weatherData.city}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="floating-card card-3">
        <CheckCircleOutlined className="info-card-icon schedule" />
        <div className="info-card-content">
          {!userLoggedIn ? (
            <>
              <span className="info-card-title">今日日程</span>
              <span className="info-card-sub schedule-login" onClick={onLogin}>
                登录后查看
              </span>
            </>
          ) : eventsLoading ? (
            <>
              <span className="info-card-title">今日日程</span>
              <span className="info-card-sub">加载中...</span>
            </>
          ) : todayEvents.length === 0 ? (
            <>
              <span className="info-card-title">今日日程</span>
              <span className="info-card-sub">暂无待办</span>
            </>
          ) : (
            <>
              <span className="info-card-title">今日 {todayEvents.length} 项日程</span>
              <span className="info-card-sub">{todayEvents[0].title}</span>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

interface QuickLinksSectionProps {
  title: string;
  links: QuickLinkItem[];
  onNavigate: (path: string) => void;
}

export const QuickLinksSection: FC<QuickLinksSectionProps> = ({
  title,
  links,
  onNavigate,
}) => (
  <div className="section">
    <div className="section-header">
      <Title level={3} className="section-title">
        🚀 {title}
      </Title>
    </div>
    <Row gutter={[20, 20]} className="quick-links">
      {links.map((link) => (
        <Col xs={12} sm={6} key={link.key}>
          <Card className="quick-link-card" hoverable onClick={() => onNavigate(link.path)}>
            <div className="link-icon" style={{ background: link.color }}>
              {link.icon}
            </div>
            <div className="link-info">
              <Text strong>{link.title}</Text>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  </div>
);

interface RecentActivitySectionProps {
  title: string;
  latestArticlesTitle: string;
  latestMomentsTitle: string;
  noContentText: string;
  noArticlesText: string;
  noMomentsText: string;
  unknownText: string;
  publishedText: string;
  draftText: string;
  momentsTagText: string;
  locale: string;
  recentBlogs: BlogDto[];
  recentMoments: MomentDto[];
  onBlogClick: (id: number) => void;
  onMomentClick: (id: number) => void;
}

export const RecentActivitySection: FC<RecentActivitySectionProps> = ({
  title,
  latestArticlesTitle,
  latestMomentsTitle,
  noContentText,
  noArticlesText,
  noMomentsText,
  unknownText,
  publishedText,
  draftText,
  momentsTagText,
  locale,
  recentBlogs,
  recentMoments,
  onBlogClick,
  onMomentClick,
}) => {
  const dateLocale =
    locale === 'zh-CN' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US';

  return (
    <div className="section">
      <div className="section-header">
        <Title level={3} className="section-title">
          📝 {title}
        </Title>
        <Text type="secondary">
          <RightOutlined />
        </Text>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={`📰 ${latestArticlesTitle}`} className="activity-card">
            <div className="activity-list">
              {recentBlogs.length > 0 ? (
                recentBlogs.map((blog) => (
                  <div key={blog.id} className="activity-item" onClick={() => onBlogClick(blog.id)}>
                    <div className="activity-icon">
                      <FileTextOutlined />
                    </div>
                    <div className="activity-content">
                      <Text strong>
                        {blog.title?.slice(0, 30) || noContentText}
                        {blog.title && blog.title.length > 30 ? '...' : ''}
                      </Text>
                      <Text type="secondary" className="activity-time">
                        <ClockCircleOutlined />{' '}
                        {blog.createdAt
                          ? new Date(blog.createdAt).toLocaleDateString(dateLocale)
                          : unknownText}
                      </Text>
                    </div>
                    <Tag color="purple">{blog.isPublished ? publishedText : draftText}</Tag>
                  </div>
                ))
              ) : (
                <div className="activity-item">
                  <Text type="secondary">{noArticlesText}</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={`💬 ${latestMomentsTitle}`} className="activity-card">
            <div className="activity-list">
              {recentMoments.length > 0 ? (
                recentMoments.map((moment) => (
                  <div
                    key={moment.id}
                    className="activity-item"
                    onClick={() => onMomentClick(moment.id)}
                  >
                    <div className="activity-icon fire">
                      <MessageOutlined />
                    </div>
                    <div className="activity-content">
                      <Text strong>
                        {moment.content?.slice(0, 30) || noContentText}
                        {moment.content && moment.content.length > 30 ? '...' : ''}
                      </Text>
                      <Text type="secondary" className="activity-time">
                        <ClockCircleOutlined />{' '}
                        {moment.createdAt
                          ? new Date(moment.createdAt).toLocaleDateString(dateLocale)
                          : unknownText}
                      </Text>
                    </div>
                    <Tag color="orange">{momentsTagText}</Tag>
                  </div>
                ))
              ) : (
                <div className="activity-item">
                  <Text type="secondary">{noMomentsText}</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

interface StatsSectionProps {
  title: string;
  articlesText: string;
  momentsText: string;
  viewsText: string;
  stats: {
    articles: number;
    moments: number;
    views: number;
  };
  loading: boolean;
}

export const StatsSection: FC<StatsSectionProps> = ({
  title,
  articlesText,
  momentsText,
  viewsText,
  stats,
  loading,
}) => (
  <div className="section">
    <div className="section-header">
      <Title level={3} className="section-title">
        📊 {title}
      </Title>
    </div>
    <Row gutter={[24, 24]} className="stats-row">
      <Col xs={12} sm={6}>
        <Card className="stat-card">
          <Statistic
            title={articlesText}
            value={stats.articles}
            prefix={<FileTextOutlined />}
            styles={{ content: { color: '#667eea' } }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="stat-card">
          <Statistic
            title={momentsText}
            value={stats.moments}
            prefix={<MessageOutlined />}
            styles={{ content: { color: '#f5576c' } }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card className="stat-card">
          <Statistic
            title={viewsText}
            value={stats.views}
            prefix={<EyeOutlined />}
            styles={{ content: { color: '#4facfe' } }}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  </div>
);
