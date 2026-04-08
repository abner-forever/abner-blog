import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  FireOutlined,
  ReadOutlined,
  ToolOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '@services/generated/app/app';
import { calendarControllerFindAll } from '@services/generated/calendar/calendar';
import { getWeather } from '@services/generated/weather/weather';
import { blogsControllerFindAll } from '@services/generated/blogs/blogs';
import { momentsControllerFindAll } from '@services/generated/moments/moments';
import { getCurrentLocale } from '@/i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import {
  HeroSection,
  QuickLinksSection,
  RecentActivitySection,
  StatsSection,
  type CalendarEventData,
  type QuickLinkItem,
} from './components';
import './index.less';

dayjs.locale('zh-cn');

// 天气代码映射（作为后端字段缺失时的兜底）
const weatherCodeMap: Record<number, { text: string; iconCode: number }> = {
  0: { text: '晴', iconCode: 100 },
  1: { text: '大体晴朗', iconCode: 101 },
  2: { text: '局部多云', iconCode: 102 },
  3: { text: '阴天', iconCode: 104 },
  45: { text: '有雾', iconCode: 500 },
  48: { text: '冰雾', iconCode: 501 },
  51: { text: '轻毛毛雨', iconCode: 305 },
  53: { text: '毛毛雨', iconCode: 306 },
  55: { text: '大毛毛雨', iconCode: 307 },
  61: { text: '小雨', iconCode: 300 },
  63: { text: '中雨', iconCode: 301 },
  65: { text: '大雨', iconCode: 302 },
  71: { text: '小雪', iconCode: 400 },
  73: { text: '中雪', iconCode: 401 },
  75: { text: '大雪', iconCode: 402 },
  77: { text: '冰晶', iconCode: 404 },
  80: { text: '阵雨', iconCode: 350 },
  81: { text: '阵雨', iconCode: 351 },
  82: { text: '暴雨', iconCode: 351 },
  85: { text: '阵雪', iconCode: 456 },
  86: { text: '大阵雪', iconCode: 457 },
  95: { text: '雷暴', iconCode: 302 },
  96: { text: '冰雹雷暴', iconCode: 304 },
  99: { text: '大冰雹雷暴', iconCode: 304 },
};

function getWeatherInfo(code: number) {
  // 查找最近匹配的天气代码
  const entry = weatherCodeMap[code];
  if (entry) return entry;
  // 按范围兜底
  if (code <= 3) return { text: '多云', iconCode: 101 };
  if (code <= 48) return { text: '有雾', iconCode: 500 };
  if (code <= 67) return { text: '有雨', iconCode: 300 };
  if (code <= 77) return { text: '有雪', iconCode: 400 };
  if (code <= 82) return { text: '阵雨', iconCode: 350 };
  return { text: '雷暴', iconCode: 302 };
}

function getQweatherIconClass(code: number): string {
  if (code >= 100) return `qi-${code}`;
  const weatherInfo = getWeatherInfo(code);
  return `qi-${weatherInfo.iconCode}`;
}

interface WeatherState {
  city: string;
  temp: number;
  tempMax: number;
  tempMin: number;
  weatherText: string;
  weatherIconClass: string;
}

const Home: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = getCurrentLocale();
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentTime, setCurrentTime] = useState('');

  // 时钟
  useEffect(() => {
    const fmt =
      locale === 'zh-CN' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US';
    const update = () =>
      setCurrentTime(
        new Date().toLocaleTimeString(fmt, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [locale]);

  const { data: stats = { articles: 0, moments: 0, views: 0, users: 0 }, isLoading } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const data = await getStats();
      return data;
    },
  });

  const { data: recentBlogs = [] } = useQuery({
    queryKey: ['home-recent-blogs'],
    queryFn: async () => {
      const blogRes = await blogsControllerFindAll({
        page: 1,
        pageSize: 3,
      });
      return blogRes?.list?.slice(0, 3) || [];
    },
  });

  const { data: recentMoments = [] } = useQuery({
    queryKey: ['home-recent-moments'],
    queryFn: async () => {
      const momentRes = await momentsControllerFindAll({
        page: 1,
        pageSize: 3,
      });
      return momentRes?.list || [];
    },
  });

  const {
    data: weather,
    isLoading: weatherLoading,
    isError: weatherError,
  } = useQuery<WeatherState>({
    queryKey: ['home-weather'],
    queryFn: async () => {
      const d = await getWeather();
      const weatherInfo = getWeatherInfo(d.weatherCode ?? 0);
      return {
        city: d.city || '北京',
        temp: d.temperature ?? 0,
        tempMax: d.temperatureMax ?? d.temperature ?? 0,
        tempMin: d.temperatureMin ?? d.temperature ?? 0,
        weatherText: d.weatherText || weatherInfo.text,
        weatherIconClass: getQweatherIconClass(d.weatherCode ?? 0),
      };
    },
  });

  const { data: todayEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['home-today-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const events = (await calendarControllerFindAll({
        startDate: today,
        endDate: today,
      })) as CalendarEventData[];
      return (events || []).filter((e) => !e.completed).slice(0, 3);
    },
  });

  const quickLinks: QuickLinkItem[] = [
    {
      key: 'chat',
      title: 'AI 聊天',
      icon: <RobotOutlined />,
      path: '/chat',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      key: 'moments',
      title: t('home.momentsTitle'),
      icon: <FireOutlined />,
      path: '/moments',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      key: 'news',
      title: t('home.newsTitle'),
      icon: <ReadOutlined />,
      path: '/news',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      key: 'tools',
      title: t('home.toolsTitle'),
      icon: <ToolOutlined />,
      path: '/tools',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6)
      return t('home.greeting.lateNight') + '，' + t('common.noteRest');
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 14) return t('home.greeting.afternoon');
    if (hour < 18) return t('home.greeting.evening');
    if (hour < 22) return t('home.greeting.night');
    return t('home.greeting.lateNight');
  };

  return (
    <div className="home-page">
      <HeroSection
        greeting={getGreeting()}
        currentTime={currentTime}
        welcomeText={t('home.welcome')}
        siteNameText={t('home.siteName')}
        subtitleText={t('home.subtitle')}
        browseArticlesText={t('home.browseArticles')}
        aboutMeText={t('home.aboutMe')}
        userLoggedIn={!!user}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        weatherData={weather || null}
        eventsLoading={eventsLoading}
        todayEvents={todayEvents}
        onBrowseArticles={() => navigate('/blogs')}
        onAbout={() => navigate('/about')}
        onLogin={() => navigate('/login')}
      />

      <QuickLinksSection
        title={t('home.quickEntry')}
        links={quickLinks}
        onNavigate={navigate}
      />

      <RecentActivitySection
        title={t('home.recentActivity')}
        latestArticlesTitle={t('home.latestArticles')}
        latestMomentsTitle={t('home.latestMoments')}
        noContentText={t('home.noContent')}
        noArticlesText={t('home.noArticles')}
        noMomentsText={t('home.noMoments')}
        unknownText={t('home.unknown')}
        publishedText={t('home.published')}
        draftText={t('home.draft')}
        momentsTagText={t('nav.moments')}
        locale={locale}
        recentBlogs={recentBlogs}
        recentMoments={recentMoments}
        onBlogClick={(id) => navigate(`/blogs/${id}`)}
        onMomentClick={(id) => navigate(`/moments/${id}`)}
      />

      <StatsSection
        title={t('home.dataStats')}
        articlesText={t('home.articles')}
        momentsText={t('home.moments')}
        viewsText={t('home.totalViews')}
        usersText={t('home.totalUsers')}
        stats={stats}
        loading={isLoading}
      />
    </div>
  );
};

export default Home;
