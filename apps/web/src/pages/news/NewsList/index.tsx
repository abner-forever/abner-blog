import React, { useState } from 'react';
import { Card, Typography, Tag, Pagination, Button } from 'antd';
import {
  FireOutlined,
  SyncOutlined,
  GithubOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import {
  getHotSearchData,
  formatHotNumber,
  type HotSearchItem,
} from '@/services/hotSearch';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DataList from '@/components/DataList';
import Loading from '@/components/Loading';
import CustomEmpty from '@/components/CustomEmpty';
import './index.less';

const { Title, Paragraph } = Typography;
const HOT_SEARCH_QUERY_KEY = ['hot-search-data'] as const;

const platformConfig = [
  { key: 'all', label: '全部', icon: <FireOutlined />, color: '#ff4d4f' },
  {
    key: 'weibo',
    label: '微博',
    icon: <VideoCameraOutlined />,
    color: '#e6162d',
  },
  {
    key: 'bilibili',
    label: 'B站',
    icon: <VideoCameraOutlined />,
    color: '#00a1d6',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: <GithubOutlined />,
    color: '#24292e',
  },
  {
    key: 'toutiao',
    label: '网易新闻',
    icon: <BookOutlined />,
    color: '#ff6900',
  },
  {
    key: 'douyin',
    label: '抖音',
    icon: <VideoCameraOutlined />,
    color: '#fe2c55',
  },
];
const pageSize = 10;

const NewsList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activePlatform, setActivePlatform] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHotData = async (forceRefresh = false): Promise<HotSearchItem[]> => {
    const response = await getHotSearchData(forceRefresh);
    const allData: HotSearchItem[] = [];

    Object.entries(response.data).forEach(([platform, items]) => {
      items.forEach((item) => {
        allData.push({ ...item, platform });
      });
    });

    allData.sort((a, b) => b.hot - a.hot);
    return allData;
  };

  const { data: hotData = [], isLoading } = useQuery({
    queryKey: HOT_SEARCH_QUERY_KEY,
    queryFn: () => fetchHotData(),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const latestData = await fetchHotData(true);
      queryClient.setQueryData(HOT_SEARCH_QUERY_KEY, latestData);
    } finally {
      setRefreshing(false);
    }
  };

  // 按平台筛选
  const filteredData =
    activePlatform === 'all'
      ? hotData
      : hotData.filter((item) => item.platform === activePlatform);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const getPlatformColor = (platform: string) => {
    const config = platformConfig.find((p) => p.key === platform);
    return config?.color || '#999';
  };

  const getPlatformIcon = (platform: string) => {
    const config = platformConfig.find((p) => p.key === platform);
    return config?.icon || <FireOutlined />;
  };

  // 获取排名样式
  const getRankStyle = (index: number) => {
    if (index < 3) {
      return { color: '#ff4d4f', fontWeight: 'bold' as const };
    }
    return {};
  };

  return (
    <div className="news-page">
      <div className="news-header">
        <Title level={2} className="page-title">
          🔥 实时热搜
        </Title>
        <Paragraph className="page-desc">
          聚合全网热门话题，一站式了解最新热点
        </Paragraph>
      </div>

      {/* 平台标签 */}
      <div className="platform-tabs">
        {platformConfig.map((platform) => (
          <Tag
            key={platform.key}
            className={`platform-tag ${activePlatform === platform.key ? 'active' : ''}`}
            onClick={() => {
              setActivePlatform(platform.key);
              setCurrentPage(1);
            }}
            style={{
              background:
                activePlatform === platform.key
                  ? platform.color
                  : 'transparent',
              borderColor: platform.color,
              color: activePlatform === platform.key ? '#fff' : platform.color,
            }}
          >
            {platform.icon} {platform.label}
          </Tag>
        ))}
        <Button
          type="text"
          icon={<SyncOutlined spin={refreshing} />}
          onClick={handleRefresh}
          className="refresh-btn"
        >
          刷新
        </Button>
      </div>

      {isLoading ? (
        <Loading page tip={t('common.loading')} />
      ) : paginatedData.length > 0 ? (
        <>
          <Card className="hot-list-card">
            <DataList
              dataSource={paginatedData}
              rowKey={(item) => item.id}
              listRole={false}
              itemRole={false}
              rowClassName="hot-item"
              renderItem={(item, index) => (
                <>
                  <div
                    className="hot-rank"
                    style={getRankStyle(index + (currentPage - 1) * pageSize)}
                  >
                    {index + 1 + (currentPage - 1) * pageSize}
                  </div>
                  <div className="hot-content">
                    <div className="hot-title-row">
                      <span className="hot-icon">{item.icon}</span>
                      <a
                        className="hot-title"
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.title}
                      </a>
                      <Tag
                        className="platform-badge"
                        style={{
                          background: getPlatformColor(item.platform) + '20',
                          color: getPlatformColor(item.platform),
                          border: 'none',
                        }}
                      >
                        {getPlatformIcon(item.platform)}
                      </Tag>
                    </div>
                    <div className="hot-meta">
                      <span className="hot-value">
                        <FireOutlined /> {formatHotNumber(item.hot)}
                      </span>
                      <span className="hot-time">
                        <ClockCircleOutlined /> 实时更新
                      </span>
                    </div>
                  </div>
                </>
              )}
            />
          </Card>
          <div className="pagination-container">
            <Pagination
              current={currentPage}
              total={filteredData.length}
              pageSize={pageSize}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total) => `共 ${total} 条热搜`}
            />
          </div>
        </>
      ) : (
        <CustomEmpty tip="暂无热搜数据" />
      )}
    </div>
  );
};

export default NewsList;
