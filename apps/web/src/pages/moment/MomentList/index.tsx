import { useState, useMemo } from 'react';
import { Button, Input, Avatar, Divider, Pagination } from 'antd';
import {
  PlusOutlined,
  FireOutlined,
  ClockCircleOutlined,
  TagOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMoments } from '@/hooks/useMoments';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { MomentDto } from '@services/generated/model';
import MomentCard from '../../../components/MomentCard';
import Loading from '@/components/Loading';
import CustomEmpty from '@/components/CustomEmpty';
import './index.less';
import { topicsControllerFindHot } from '@/services/generated/topics/topics';

const { Search } = Input;

const MomentListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'time' | 'hot'>('time');
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');

  const params = useMemo(
    () => ({
      page: currentPage,
      pageSize: 10,
      sortBy,
      ...(selectedTopicId && { topicId: selectedTopicId }),
      ...(searchKeyword && { search: searchKeyword }),
    }),
    [currentPage, sortBy, selectedTopicId, searchKeyword],
  );

  const { data: momentsData, isLoading } = useMoments(params);
  const { data: topics=[] } = useQuery({
    queryKey: ['topics'],
    queryFn: async()=>{
      const data = await topicsControllerFindHot()
      return data || [];
    },
  });

  const moments: MomentDto[] = momentsData?.list || [];
  const total = momentsData?.total || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const handleTopicClick = (topicId: number | undefined) => {
    setSelectedTopicId(topicId);
    setCurrentPage(1);
  };

  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: ['moments'] });
  };

  return (
    <div className="moment-page">
      {/* 顶部横幅 */}
      <div className="moment-page-banner">
        <div className="banner-inner">
          <div className="banner-text">
            <h1>{t('nav.moments')}</h1>
            <p>分享你的想法，发现有趣的灵魂</p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/moments/create')}
            className="banner-create-btn"
          >
            {t('moment.create')}
          </Button>
        </div>
      </div>

      <div className="moment-page-body">
        {/* 左侧边栏：话题分类 */}
        <aside className="moment-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">
              <TagOutlined />
              <span>话题分类</span>
            </div>
            <div className="topic-list">
              <button
                className={`topic-item ${!selectedTopicId ? 'active' : ''}`}
                onClick={() => handleTopicClick(undefined)}
              >
                <span className="topic-name">全部</span>
                <RightOutlined className="topic-arrow" />
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  className={`topic-item ${selectedTopicId === topic.id ? 'active' : ''}`}
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <span className="topic-name">#{topic.name}</span>
                  {topic.momentCount > 0 && (
                    <span className="topic-count">{topic.momentCount}</span>
                  )}
                  <RightOutlined className="topic-arrow" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 中间内容区 */}
        <main className="moment-feed">
          {/* 排序 & 搜索工具栏 */}
          <div className="feed-toolbar">
            <div className="sort-tabs">
              <button
                className={`sort-tab ${sortBy === 'time' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('time');
                  setCurrentPage(1);
                }}
              >
                <ClockCircleOutlined />
                {t('moment.sortByTime')}
              </button>
              <button
                className={`sort-tab ${sortBy === 'hot' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('hot');
                  setCurrentPage(1);
                }}
              >
                <FireOutlined />
                {t('moment.sortByHot')}
              </button>
            </div>
            <Search
              placeholder={t('moment.searchPlaceholder')}
              allowClear
              onSearch={handleSearch}
              className="feed-search"
            />
          </div>

          {/* 内容列表 */}
          {isLoading ? (
            <Loading />
          ) : moments.length === 0 ? (
            <div className="feed-empty">
              <CustomEmpty tip={t('common.emptyMoment')} />
            </div>
          ) : (
            <div className="feed-list">
              {moments.map((moment, index) => (
                <div key={moment.id}>
                  <MomentCard
                    moment={moment}
                    onUpdate={refreshList}
                    showActions
                  />
                  {index < moments.length - 1 && (
                    <Divider className="feed-divider" />
                  )}
                </div>
              ))}
            </div>
          )}

          {total > 0 && (
            <div className="feed-pagination">
              <Pagination
                current={currentPage}
                pageSize={10}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>
          )}
        </main>

        {/* 右侧边栏 */}
        <aside className="moment-right-sidebar">
          {/* 发布入口 */}
          <div className="right-card publish-card">
            <div className="publish-avatar">
              <Avatar
                size={36}
                style={{ backgroundColor: 'var(--skin-primary)' }}
              >
                你
              </Avatar>
            </div>
            <button
              className="publish-input-fake"
              onClick={() => navigate('/moments/create')}
            >
              分享你的想法...
            </button>
          </div>

          {/* 热门话题 */}
          {topics.length > 0 && (
            <div className="right-card">
              <div className="right-card-title">
                <FireOutlined />
                <span>热门话题</span>
              </div>
              <div className="hot-topics">
                {topics.slice(0, 8).map((topic, index) => (
                  <button
                    key={topic.id}
                    className="hot-topic-item"
                    onClick={() => handleTopicClick(topic.id)}
                  >
                    <span className={`rank-num ${index < 3 ? 'top3' : ''}`}>
                      {index + 1}
                    </span>
                    <span className="hot-topic-name">#{topic.name}</span>
                    {topic.momentCount > 0 && (
                      <span className="hot-topic-count">
                        {topic.momentCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MomentListPage;
