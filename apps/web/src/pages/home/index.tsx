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
import { appControllerGetStats } from '@services/generated/app/app';
import { calendarControllerFindAll } from '@services/generated/calendar/calendar';
import { weatherControllerGetWeather } from '@services/generated/weather/weather';
import { httpMutator } from '@services/http';
import type { BlogDto, MomentDto } from '@services/generated/model';
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

// WMO 天气代码映射
const weatherCodeMap: Record<number, { text: string; emoji: string }> = {
  0: { text: '晴', emoji: '☀️' },
  1: { text: '大体晴朗', emoji: '🌤️' },
  2: { text: '局部多云', emoji: '⛅' },
  3: { text: '阴天', emoji: '☁️' },
  45: { text: '有雾', emoji: '🌫️' },
  48: { text: '冰雾', emoji: '🌫️' },
  51: { text: '轻毛毛雨', emoji: '🌦️' },
  53: { text: '毛毛雨', emoji: '🌦️' },
  55: { text: '大毛毛雨', emoji: '🌦️' },
  61: { text: '小雨', emoji: '🌧️' },
  63: { text: '中雨', emoji: '🌧️' },
  65: { text: '大雨', emoji: '🌧️' },
  71: { text: '小雪', emoji: '🌨️' },
  73: { text: '中雪', emoji: '🌨️' },
  75: { text: '大雪', emoji: '🌨️' },
  77: { text: '冰晶', emoji: '❄️' },
  80: { text: '阵雨', emoji: '🌦️' },
  81: { text: '阵雨', emoji: '🌦️' },
  82: { text: '暴雨', emoji: '⛈️' },
  85: { text: '阵雪', emoji: '🌨️' },
  86: { text: '大阵雪', emoji: '🌨️' },
  95: { text: '雷暴', emoji: '⛈️' },
  96: { text: '冰雹雷暴', emoji: '⛈️' },
  99: { text: '大冰雹雷暴', emoji: '⛈️' },
};

function getWeatherInfo(code: number) {
  // 查找最近匹配的天气代码
  const entry = weatherCodeMap[code];
  if (entry) return entry;
  // 按范围兜底
  if (code <= 3) return { text: '多云', emoji: '⛅' };
  if (code <= 48) return { text: '有雾', emoji: '🌫️' };
  if (code <= 67) return { text: '有雨', emoji: '🌧️' };
  if (code <= 77) return { text: '有雪', emoji: '🌨️' };
  if (code <= 82) return { text: '阵雨', emoji: '🌦️' };
  return { text: '雷暴', emoji: '⛈️' };
}

interface WeatherState {
  city: string;
  temp: number;
  tempMax: number;
  tempMin: number;
  weatherText: string;
  weatherEmoji: string;
}

interface WeatherResponseData {
  city?: string;
  temperature?: number;
  temperatureMax?: number;
  temperatureMin?: number;
  weatherCode?: number;
}

interface WeatherApiResponse {
  data?: WeatherResponseData;
}

const isWeatherData = (value: unknown): value is WeatherResponseData => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.temperature === 'number' &&
    typeof item.weatherCode === 'number'
  );
};

const resolveWeatherPayload = (value: unknown): WeatherResponseData | null => {
  if (isWeatherData(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const wrapped = value as WeatherApiResponse;
  if (isWeatherData(wrapped.data)) return wrapped.data;
  return null;
};

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

  const { data: stats = { articles: 0, moments: 0, views: 0 }, isLoading } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const data = (await appControllerGetStats()) as unknown as {
        articles?: number;
        moments?: number;
        views?: number;
        data?: { articles?: number; moments?: number; views?: number };
      };
      const statsData = data?.data ?? data;
      return {
        articles: statsData?.articles || 0,
        moments: statsData?.moments || 0,
        views: statsData?.views || 0,
      };
    },
  });

  const { data: recentBlogs = [] } = useQuery({
    queryKey: ['home-recent-blogs'],
    queryFn: async () => {
      const blogRes = await httpMutator<{ list: BlogDto[] }>({
        url: '/api/blogs',
        method: 'GET',
        params: { page: 1, pageSize: 3 },
      });
      return blogRes?.list?.slice(0, 3) || [];
    },
  });

  const { data: recentMoments = [] } = useQuery({
    queryKey: ['home-recent-moments'],
    queryFn: async () => {
      const momentRes = await httpMutator<{ list: MomentDto[] }>({
        url: '/api/moments',
        method: 'GET',
        params: { page: 1, pageSize: 3 },
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
      const response = await (weatherControllerGetWeather({
        city: '北京',
      }) as Promise<unknown>);
      const d = resolveWeatherPayload(response);
      if (!d) throw new Error('Invalid weather response');
      const weatherInfo = getWeatherInfo(d.weatherCode ?? 0);
      return {
        city: d.city || '北京',
        temp: d.temperature ?? 0,
        tempMax: d.temperatureMax ?? d.temperature ?? 0,
        tempMin: d.temperatureMin ?? d.temperature ?? 0,
        weatherText: weatherInfo.text,
        weatherEmoji: weatherInfo.emoji,
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
        stats={stats}
        loading={isLoading}
      />
    </div>
  );
};

export default Home;
