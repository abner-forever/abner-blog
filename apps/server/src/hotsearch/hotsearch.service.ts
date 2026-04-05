import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface HotSearchItem {
  id: string;
  title: string;
  hot: number;
  url: string;
  platform: string;
  icon: string;
}

interface HotSearchResponse {
  weibo: HotSearchItem[];
  bilibili: HotSearchItem[];
  github: HotSearchItem[];
  toutiao: HotSearchItem[];
  douyin: HotSearchItem[];
}

// Platform-specific API response interfaces
interface WeiboHotItem {
  note?: string;
  word?: string;
  num?: number;
}

interface BilibiliHotItem {
  title?: string;
  bvid?: string;
  stat?: { view?: number };
}

interface GitHubRepoItem {
  full_name?: string;
  stargazers_count?: number;
  html_url?: string;
}

interface ToutiaoHotItem {
  title?: string;
  point?: string;
  docurl?: string;
  tlink?: string;
}

interface DouyinHotItem {
  word?: string;
  hot_value?: number;
  video_count?: number;
}

@Injectable()
export class HotsearchService {
  private readonly timeout = 8000;
  private readonly cacheTTL = 30 * 60 * 1000; // 30 分钟缓存
  private cache: { data: HotSearchResponse; timestamp: number } | null = null;

  async getAllHotSearch(forceRefresh = false): Promise<HotSearchResponse> {
    // 检查缓存是否有效（30 分钟 TTL）
    if (
      !forceRefresh &&
      this.cache &&
      Date.now() - this.cache.timestamp < this.cacheTTL
    ) {
      return this.cache.data;
    }

    const [weibo, bilibili, github, toutiao, douyin] = await Promise.allSettled(
      [
        this.getWeiboHot(),
        this.getBilibiliHot(),
        this.getGitHubHot(),
        this.getToutiaoHot(),
        this.getDouyinHot(),
      ],
    );

    const data: HotSearchResponse = {
      weibo: weibo.status === 'fulfilled' ? weibo.value : [],
      bilibili: bilibili.status === 'fulfilled' ? bilibili.value : [],
      github: github.status === 'fulfilled' ? github.value : [],
      toutiao: toutiao.status === 'fulfilled' ? toutiao.value : [],
      douyin: douyin.status === 'fulfilled' ? douyin.value : [],
    };

    // 更新缓存
    this.cache = { data, timestamp: Date.now() };

    return data;
  }

  /** 强制刷新缓存（供管理接口调用） */
  async refreshCache(): Promise<HotSearchResponse> {
    return this.getAllHotSearch(true);
  }

  // 微博热搜
  async getWeiboHot(): Promise<HotSearchItem[]> {
    try {
      const response: { data?: { data?: { realtime?: WeiboHotItem[] } } } =
        await axios.get('https://weibo.com/ajax/side/hotSearch', {
          timeout: this.timeout,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://weibo.com',
          },
        });

      if (response.data?.data?.realtime) {
        return response.data.data.realtime
          .filter((item: WeiboHotItem) => item.note && item.num && item.num > 0)
          .slice(0, 20)
          .map((item: WeiboHotItem, index: number) => ({
            id: String(index + 1),
            title: item.note || item.word || '',
            hot: item.num || 0,
            url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.note || item.word || '')}`,
            platform: 'weibo',
            icon: '📱',
          }));
      }
      return this.getDefaultWeibo();
    } catch (error) {
      console.error('Weibo hot search error:', (error as Error).message);
      return this.getDefaultWeibo();
    }
  }

  private getDefaultWeibo(): HotSearchItem[] {
    return [
      {
        id: '1',
        title: '微博热搜',
        hot: 1000000,
        url: 'https://weibo.com',
        platform: 'weibo',
        icon: '📱',
      },
      {
        id: '2',
        title: '热门话题',
        hot: 800000,
        url: 'https://weibo.com',
        platform: 'weibo',
        icon: '📱',
      },
    ];
  }

  // Bilibili 热门
  async getBilibiliHot(): Promise<HotSearchItem[]> {
    try {
      const response: {
        data?: { code?: number; data?: { list?: BilibiliHotItem[] } };
      } = await axios.get('https://api.bilibili.com/x/web-interface/popular', {
        params: { pn: 1, ps: 20 },
        timeout: this.timeout,
      });

      if (response.data?.code === 0 && response.data?.data?.list) {
        return response.data.data.list.map(
          (item: BilibiliHotItem, index: number) => ({
            id: String(index + 1),
            title: item.title?.replace(/<[^>]+>/g, '') || '',
            hot: item.stat?.view || 0,
            url: `https://www.bilibili.com/video/${item.bvid}`,
            platform: 'bilibili',
            icon: '🎬',
          }),
        );
      }
      return this.getDefaultBilibili();
    } catch (error) {
      console.error('Bilibili hot search error:', (error as Error).message);
      return this.getDefaultBilibili();
    }
  }

  private getDefaultBilibili(): HotSearchItem[] {
    return [
      {
        id: '1',
        title: 'B站热门视频',
        hot: 500000,
        url: 'https://bilibili.com',
        platform: 'bilibili',
        icon: '🎬',
      },
      {
        id: '2',
        title: '精彩内容推荐',
        hot: 300000,
        url: 'https://bilibili.com',
        platform: 'bilibili',
        icon: '🎬',
      },
    ];
  }

  // GitHub trending
  async getGitHubHot(): Promise<HotSearchItem[]> {
    try {
      const response: { data?: { items?: GitHubRepoItem[] } } = await axios.get(
        'https://api.github.com/search/repositories',
        {
          params: {
            q: 'created:>2024-01-01',
            sort: 'stars',
            order: 'desc',
            per_page: 20,
          },
          timeout: this.timeout,
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (response.data?.items) {
        return response.data.items.map(
          (repo: GitHubRepoItem, index: number) => ({
            id: String(index + 1),
            title: repo.full_name || '',
            hot: repo.stargazers_count || 0,
            url: repo.html_url || '',
            platform: 'github',
            icon: '⚡',
          }),
        );
      }
      return this.getDefaultGitHub();
    } catch (error) {
      console.error('GitHub hot search error:', (error as Error).message);
      return this.getDefaultGitHub();
    }
  }

  private getDefaultGitHub(): HotSearchItem[] {
    return [
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
    ];
  }

  // 网易新闻热榜
  async getToutiaoHot(): Promise<HotSearchItem[]> {
    try {
      const response: { data: string } = await axios.get(
        'https://news.163.com/special/cm_yaowen20200213/',
        {
          timeout: this.timeout,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
      );

      // 返回的是 JSONP 格式，需要提取数据
      const text: string = response.data;
      const match = text.match(/data_callback\(([\s\S]*)\);?$/);
      if (match) {
        const data = JSON.parse(match[1]) as ToutiaoHotItem[];
        return data.slice(0, 20).map((item: ToutiaoHotItem, index: number) => ({
          id: String(index + 1),
          title: item.title || '',
          hot: parseInt(item.point || '0') * 1000 || 0,
          url: item.docurl || item.tlink || '',
          platform: 'toutiao',
          icon: '📰',
        }));
      }
      return this.getDefaultToutiao();
    } catch (error) {
      console.error('163 news hot search error:', (error as Error).message);
      return this.getDefaultToutiao();
    }
  }

  private getDefaultToutiao(): HotSearchItem[] {
    return [
      {
        id: '1',
        title: '网易新闻热榜',
        hot: 1000000,
        url: 'https://news.163.com',
        platform: 'toutiao',
        icon: '📰',
      },
      {
        id: '2',
        title: '热门新闻',
        hot: 800000,
        url: 'https://news.163.com',
        platform: 'toutiao',
        icon: '📰',
      },
    ];
  }

  // 抖音热搜榜 - 使用官方 Douyin Web API
  async getDouyinHot(): Promise<HotSearchItem[]> {
    try {
      const response: {
        data?: { data?: { trending_list?: DouyinHotItem[] } };
      } = await axios.get(
        'https://www.douyin.com/aweme/v1/web/hot/search/list/',
        {
          timeout: this.timeout,
          params: {
            aid: 6383,
            count: 20,
            offset: 0,
            filter_wht: 0,
            publish_strategy_strategy: 1,
            pc_client_type: 1,
            version_code: 190600,
            version_name: '19.6.0',
          },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            Accept: '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            Referer: 'https://www.douyin.com/',
          },
        },
      );

      const trendingList = response.data?.data?.trending_list;

      if (
        trendingList &&
        Array.isArray(trendingList) &&
        trendingList.length > 0
      ) {
        return trendingList
          .slice(0, 20)
          .map((item: DouyinHotItem, index: number) => {
            // hot_value 可能为 0，使用 video_count 作为辅助热度值
            const hotValue = item.hot_value || (item.video_count || 0) * 10000;
            return {
              id: String(index + 1),
              title: item.word || `热门话题${index + 1}`,
              hot: hotValue,
              url: `https://www.douyin.com/search/${encodeURIComponent(item.word || '')}`,
              platform: 'douyin',
              icon: '🎵',
            };
          });
      }

      return this.getDefaultDouyin();
    } catch (error) {
      console.error('Douyin hot search error:', (error as Error).message);
      return this.getDefaultDouyin();
    }
  }

  private getDefaultDouyin(): HotSearchItem[] {
    // 使用更真实的抖音热搜数据作为默认值
    return [
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
    ];
  }
}
