/**
 * 热搜服务
 * API 调用使用自动生成的接口，保留 mock 降级逻辑和工具函数
 */
import { hotsearchControllerGetHotSearch } from '@services/generated/hotsearch/hotsearch';

interface HotSearchResponse {
  success: boolean;
  data: Record<string, HotSearchItem[]>;
  timestamp: number;
}

export interface HotSearchItem {
  id: string;
  title: string;
  hot: number;
  url: string;
  platform: string;
  icon?: string;
}

// 格式化数字
export const formatHotNumber = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

// 模拟热搜数据（备用）
const mockHotSearchData = {
  weibo: [
    {
      id: '1',
      title: '#欢迎使用博客#',
      hot: 28500000,
      url: 'https://weibo.com',
      platform: 'weibo',
      icon: '📱',
    },
    {
      id: '2',
      title: '点击右上角刷新热搜数据',
      hot: 15200000,
      url: 'https://weibo.com',
      platform: 'weibo',
      icon: '📚',
    },
    {
      id: '3',
      title: '实时热搜获取中...',
      hot: 9800000,
      url: 'https://weibo.com',
      platform: 'weibo',
      icon: '🚗',
    },
  ],
  zhihu: [
    {
      id: '1',
      title: '欢迎关注知乎热榜',
      hot: 1250000,
      url: 'https://zhihu.com',
      platform: 'zhihu',
      icon: '🏠',
    },
    {
      id: '2',
      title: '点击刷新获取最新数据',
      hot: 980000,
      url: 'https://zhihu.com',
      platform: 'zhihu',
      icon: '💻',
    },
  ],
  bilibili: [
    {
      id: '1',
      title: '欢迎关注B站热门',
      hot: 520000,
      url: 'https://bilibili.com',
      platform: 'bilibili',
      icon: '🎬',
    },
    {
      id: '2',
      title: '点击刷新获取最新数据',
      hot: 480000,
      url: 'https://bilibili.com',
      platform: 'bilibili',
      icon: '📊',
    },
  ],
  github: [
    {
      id: '1',
      title: 'facebook/react',
      hot: 200000,
      url: 'https://github.com/facebook/react',
      platform: 'github',
      icon: '⚡',
    },
    {
      id: '2',
      title: 'vuejs/vue',
      hot: 200000,
      url: 'https://github.com/vuejs/vue',
      platform: 'github',
      icon: '⚡',
    },
  ],
  toutiao: [
    {
      id: '1',
      title: '欢迎关注网易新闻',
      hot: 1500000,
      url: 'https://news.163.com',
      platform: 'toutiao',
      icon: '📰',
    },
    {
      id: '2',
      title: '点击刷新获取最新资讯',
      hot: 980000,
      url: 'https://news.163.com',
      platform: 'toutiao',
      icon: '📰',
    },
  ],
  douyin: [
    {
      id: '1',
      title: '挑战赛#抖音热门挑战',
      hot: 25420000,
      url: 'https://www.douyin.com/search/%E6%8C%91%E6%88%98%E8%B5%9B%23%E6%8A%96%E9%9F%B3%E7%83%AD%E9%97%A8%E6%8C%91%E6%88%98',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '2',
      title: '明星直播',
      hot: 19800000,
      url: 'https://www.douyin.com/search/%E6%98%8E%E6%98%9F%E7%9B%B4%E6%92%AD',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '3',
      title: '美食探店',
      hot: 15650000,
      url: 'https://www.douyin.com/search/%E7%BE%8E%E9%A3%9F%E6%8E%A2%E5%BA%97',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '4',
      title: '舞蹈教学',
      hot: 14200000,
      url: 'https://www.douyin.com/search/%E8%88%9E%E8%B9%88%E6%95%99%E5%AD%A6',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '5',
      title: '搞笑视频',
      hot: 12800000,
      url: 'https://www.douyin.com/search/%E6%90%9E%E7%AC%91%E8%A7%86%E9%A2%91',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '6',
      title: '宠物萌宠',
      hot: 11500000,
      url: 'https://www.douyin.com/search/%E5%AE%A0%E7%89%A9%E8%90%8C%E5%AE%A0',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '7',
      title: '旅行攻略',
      hot: 9800000,
      url: 'https://www.douyin.com/search/%E6%97%85%E8%A1%8C%E6%94%BB%E7%95%A5',
      platform: 'douyin',
      icon: '🎵',
    },
    {
      id: '8',
      title: '健身训练',
      hot: 8700000,
      url: 'https://www.douyin.com/search/%E5%81%A5%E8%BA%AB%E8%AE%AD%E7%BB%83',
      platform: 'douyin',
      icon: '🎵',
    },
  ],
};

// 获取热搜数据 - 使用自动生成的 API，支持 fallback 到 mock 数据
export const getHotSearchData = async (
  forceRefresh = false,
): Promise<HotSearchResponse> => {
  try {
    const params = forceRefresh ? { forceRefresh: true } : {};
    const response = await hotsearchControllerGetHotSearch(params);

    // 转换自动生成 API 响应格式为期望的格式
    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (response as any)?.data || response || {},
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn(
      '热搜数据获取失败，使用备用数据:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return {
      success: true,
      data: mockHotSearchData,
      timestamp: Date.now(),
    };
  }
};

// 按平台获取热搜
export const getHotSearchByPlatform = async (
  platform: keyof typeof mockHotSearchData,
): Promise<HotSearchItem[]> => {
  const response = await getHotSearchData();
  return response.data[platform] || [];
};
