import { Button, Spin, Statistic, Typography } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileTextOutlined,
  FireOutlined,
  HeartOutlined,
  MessageOutlined,
  ReadOutlined,
  RightOutlined,
  RocketOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AppStatsResponse, BlogDto, MomentDto } from '@services/generated/model';
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
  weatherIconClass: string;
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
  weatherLoading,
  weatherError,
  weatherData,
  onBrowseArticles,
  onAbout,
}) => (
  <div className="hero-banner">
    <div className="hero-bg-orb hero-bg-orb--1" />
    <div className="hero-bg-orb hero-bg-orb--2" />
    <div className="hero-bg-orb hero-bg-orb--3" />

    <div className="hero-content">
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        <Text className="hero-badge-text">{greeting}</Text>
        <Text className="hero-badge-time">{currentTime}</Text>
      </div>

      <Title level={1} className="hero-title">
        {welcomeText} <span className="hero-highlight">{siteNameText}</span>
      </Title>

      <Paragraph className="hero-desc">{subtitleText}</Paragraph>

      <div className="hero-actions">
        <Button type="primary" size="large" className="hero-btn-primary" onClick={onBrowseArticles}>
          <RocketOutlined /> {browseArticlesText}
        </Button>
        <Button size="large" className="hero-btn-secondary" onClick={onAbout}>
          {aboutMeText} <RightOutlined />
        </Button>
      </div>

      <div className="hero-info-chips">
        {weatherLoading ? (
          <div className="hero-chip">
            <Spin size="small" />
          </div>
        ) : weatherError || !weatherData ? (
          <div className="hero-chip">
            <EnvironmentOutlined />
            <span>天气获取中...</span>
          </div>
        ) : (
          <div className="hero-chip">
            <i className={`weather-icon ${weatherData.weatherIconClass}`} />
            <span>
              {weatherData.weatherText} {weatherData.temp}°
            </span>
            <span className="hero-chip-city">{weatherData.city}</span>
          </div>
        )}
        <div className="hero-chip">
          <CalendarOutlined />
          <span>{dayjs().format('M月D日 dddd')}</span>
        </div>
      </div>
    </div>

    <div className="hero-visual">
      <div className="hero-terminal">
        <div className="hero-terminal-bar">
          <span className="hero-terminal-dot hero-terminal-dot--red" />
          <span className="hero-terminal-dot hero-terminal-dot--yellow" />
          <span className="hero-terminal-dot hero-terminal-dot--green" />
          <span className="hero-terminal-title">~/blog</span>
        </div>
        <div className="hero-terminal-body">
          <div className="hero-terminal-line">
            <span className="hero-terminal-prompt">$</span>
            <span className="hero-terminal-cmd">cat welcome.md</span>
          </div>
          <div className="hero-terminal-line hero-terminal-output">
            # {siteNameText}
          </div>
          <div className="hero-terminal-line hero-terminal-output">
            {subtitleText}
          </div>
          <div className="hero-terminal-line">
            <span className="hero-terminal-prompt">$</span>
            <span className="hero-terminal-cursor" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface FeatureShowcaseProps {
  title: string;
  subtitle: string;
}

export const FeatureShowcase: FC<FeatureShowcaseProps> = ({ title, subtitle }) => {
  const features = [
    {
      icon: <FileTextOutlined />,
      title: '技术博客',
      desc: '深度技术文章与实践经验',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/blogs',
    },
    {
      icon: <MessageOutlined />,
      title: '日常动态',
      desc: '生活记录与思考碎片',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: '/moments',
    },
    {
      icon: <ReadOutlined />,
      title: '技术资讯',
      desc: '行业动态与前沿趋势',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/news',
    },
    {
      icon: <ToolOutlined />,
      title: '效率工具',
      desc: '提升开发效率的实用工具',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      path: '/tools',
    },
  ];

  return (
    <div className="feature-section">
      <div className="feature-header">
        <Title level={2} className="feature-title">{title}</Title>
        <Text className="feature-subtitle">{subtitle}</Text>
      </div>
      <div className="feature-grid">
        {features.map((feature, idx) => (
          <div
            key={feature.path}
            className="feature-card"
            style={{ animationDelay: `${idx * 0.08}s` }}
            onClick={() => window.location.assign(feature.path)}
          >
            <div className="feature-card-icon" style={{ background: feature.gradient }}>
              {feature.icon}
            </div>
            <div className="feature-card-info">
              <Text strong className="feature-card-title">{feature.title}</Text>
              <Text className="feature-card-desc">{feature.desc}</Text>
            </div>
            <RightOutlined className="feature-card-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface LatestContentProps {
  title: string;
  viewAllText: string;
  momentsTitle: string;
  noArticlesText: string;
  noMomentsText: string;
  unknownText: string;
  publishedText: string;
  draftText: string;
  locale: string;
  recentBlogs: BlogDto[];
  recentMoments: MomentDto[];
  onBlogClick: (id: number) => void;
  onMomentClick: (id: number) => void;
  onViewAllArticles: () => void;
}

export const LatestContent: FC<LatestContentProps> = ({
  title,
  viewAllText,
  momentsTitle,
  noArticlesText,
  noMomentsText,
  unknownText,
  publishedText,
  draftText,
  locale,
  recentBlogs,
  recentMoments,
  onBlogClick,
  onMomentClick,
  onViewAllArticles,
}) => {
  const dateLocale =
    locale === 'zh-CN' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US';

  const topBlogs = recentBlogs.slice(0, 2);

  return (
    <div className="latest-section">
      <div className="latest-header">
        <div>
          <Title level={2} className="latest-title">{title}</Title>
        </div>
        <Button type="link" className="latest-view-all" onClick={onViewAllArticles}>
          {viewAllText} <RightOutlined />
        </Button>
      </div>

      <div className="latest-blogs-row">
        {topBlogs.length > 0 ? (
          topBlogs.map((blog) => (
            <div
              key={blog.id}
              className="featured-blog-card"
              onClick={() => onBlogClick(blog.id)}
            >
              <div className="featured-blog-visual">
                <div className="featured-blog-icon">
                  <FileTextOutlined />
                </div>
                <div className="featured-blog-tag">
                  {blog.isPublished ? publishedText : draftText}
                </div>
              </div>
              <div className="featured-blog-content">
                <Title level={3} className="featured-blog-title">
                  {blog.title || noArticlesText}
                </Title>
                <Text className="featured-blog-meta">
                  <ClockCircleOutlined />{' '}
                  {blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString(dateLocale)
                    : unknownText}
                </Text>
                <div className="featured-blog-read">
                  <span>{viewAllText}</span>
                  <RightOutlined />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="featured-blog-card featured-blog-card--empty">
            <Text type="secondary">{noArticlesText}</Text>
          </div>
        )}
      </div>

      {recentMoments.length > 0 && (
        <div className="latest-moments-row">
          <div className="latest-section-label">{momentsTitle}</div>
          <div className="moments-strip">
            {recentMoments.map((moment) => (
              <div
                key={moment.id}
                className="moment-chip"
                onClick={() => onMomentClick(moment.id)}
              >
                <div className="moment-chip-icon">
                  <FireOutlined />
                </div>
                <div className="moment-chip-content">
                  <Text strong className="moment-chip-text">
                    {moment.content?.slice(0, 50) || noMomentsText}
                    {moment.content && moment.content.length > 50 ? '...' : ''}
                  </Text>
                  <Text className="moment-chip-time">
                    {moment.createdAt
                      ? new Date(moment.createdAt).toLocaleDateString(dateLocale)
                      : unknownText}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface StatsBarProps {
  articlesText: string;
  momentsText: string;
  viewsText: string;
  usersText: string;
  stats: AppStatsResponse;
  loading: boolean;
}

export const StatsBar: FC<StatsBarProps> = ({
  articlesText,
  momentsText,
  viewsText,
  usersText,
  stats,
  loading,
}) => (
  <div className="stats-bar">
    <div className="stats-bar-item">
      <Statistic
        title={articlesText}
        value={stats.articles}
        prefix={<FileTextOutlined />}
        loading={loading}
      />
    </div>
    <div className="stats-bar-divider" />
    <div className="stats-bar-item">
      <Statistic
        title={momentsText}
        value={stats.moments}
        prefix={<FireOutlined />}
        loading={loading}
      />
    </div>
    <div className="stats-bar-divider" />
    <div className="stats-bar-item">
      <Statistic
        title={viewsText}
        value={stats.views}
        prefix={<EyeOutlined />}
        loading={loading}
      />
    </div>
    <div className="stats-bar-divider" />
    <div className="stats-bar-item">
      <Statistic
        title={usersText}
        value={stats.users}
        prefix={<UserOutlined />}
        loading={loading}
      />
    </div>
  </div>
);

interface AboutBannerProps {
  title: string;
  description: string;
  ctaText: string;
  onCta: () => void;
}

export const AboutBanner: FC<AboutBannerProps> = ({
  title,
  description,
  ctaText,
  onCta,
}) => (
  <div className="about-banner">
    <div className="about-banner-content">
      <div className="about-banner-icon">
        <HeartOutlined />
      </div>
      <div className="about-banner-text">
        <Title level={3} className="about-banner-title">{title}</Title>
        <Paragraph className="about-banner-desc">{description}</Paragraph>
      </div>
    </div>
    <Button type="primary" size="large" className="about-banner-btn" onClick={onCta}>
      {ctaText} <RightOutlined />
    </Button>
  </div>
);
