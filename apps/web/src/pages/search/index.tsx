import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Tabs, Input, Skeleton, Avatar, Tag, Pagination } from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  FireOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { httpMutator } from '@services/http';
import type {
  BlogDto,
  MomentDto,
  BlogListResponseDto,
  MomentListResponse,
} from '@services/generated/model';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import CustomEmpty from '@/components/CustomEmpty';
import './index.less';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type TabKey = 'all' | 'blogs' | 'moments';

const PAGE_SIZE = 10;

const highlightKeyword = (text: string, keyword: string): React.ReactNode => {
  if (!keyword.trim()) return text;
  const parts = text.split(
    new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
  );
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const keyword = searchParams.get('q') || '';
  const tabFromUrl = (searchParams.get('tab') as TabKey) || 'all';

  const [inputValue, setInputValue] = useState(keyword);
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl);

  // 文章搜索状态
  const [blogs, setBlogs] = useState<BlogDto[]>([]);
  const [blogsTotal, setBlogsTotal] = useState(0);
  const [blogsPage, setBlogsPage] = useState(1);
  const [blogsLoading, setBlogsLoading] = useState(false);

  // 动态搜索状态
  const [moments, setMoments] = useState<MomentDto[]>([]);
  const [momentsTotal, setMomentsTotal] = useState(0);
  const [momentsPage, setMomentsPage] = useState(1);
  const [momentsLoading, setMomentsLoading] = useState(false);

  const fetchBlogs = useCallback(async (q: string, page: number) => {
    if (!q.trim()) return;
    setBlogsLoading(true);
    try {
      const data = await httpMutator<BlogListResponseDto>({
        url: '/api/blogs',
        method: 'GET',
        params: { search: q, page, pageSize: PAGE_SIZE },
      });
      if (data && 'list' in data) {
        setBlogs(data.list);
        setBlogsTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setBlogsLoading(false);
    }
  }, []);

  const fetchMoments = useCallback(async (q: string, page: number) => {
    if (!q.trim()) return;
    setMomentsLoading(true);
    try {
      const data = await httpMutator<MomentListResponse>({
        url: '/api/moments',
        method: 'GET',
        params: { search: q, page, pageSize: PAGE_SIZE },
      });
      if (data && 'list' in data) {
        setMoments(data.list);
        setMomentsTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setMomentsLoading(false);
    }
  }, []);

  // keyword 或 tab 变化时重置页码并重新请求
  useEffect(() => {
    if (!keyword) return;
    setBlogsPage(1);
    setMomentsPage(1);
    if (activeTab === 'all' || activeTab === 'blogs') fetchBlogs(keyword, 1);
    if (activeTab === 'all' || activeTab === 'moments')
      fetchMoments(keyword, 1);
  }, [keyword, activeTab, fetchBlogs, fetchMoments]);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    setSearchParams({ q, tab: activeTab });
  };

  const handleTabChange = (key: string) => {
    const tab = key as TabKey;
    setActiveTab(tab);
    setSearchParams({ q: keyword, tab });
  };

  const handleBlogsPageChange = (page: number) => {
    setBlogsPage(page);
    fetchBlogs(keyword, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMomentsPageChange = (page: number) => {
    setMomentsPage(page);
    fetchMoments(keyword, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCount = blogsTotal + momentsTotal;

  // ─── 文章结果列表 ──────────────────────────────────────────────────────────
  const BlogResults = () => (
    <div className="result-section">
      {blogsLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="result-skeleton">
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))
      ) : blogs.length === 0 ? (
        <CustomEmpty tip={`没有找到关于"${keyword}"的文章`} />
      ) : (
        <>
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              to={`/blogs/${blog.id}`}
              className="blog-result-item"
            >
              <div className="result-main">
                <div className="result-title">
                  {highlightKeyword(blog.title, keyword)}
                </div>
                <div className="result-summary">
                  {blog.summary
                    ? highlightKeyword(blog.summary.slice(0, 120), keyword)
                    : null}
                </div>
                <div className="result-meta">
                  <span className="meta-author">
                    <Avatar
                      src={blog.author?.avatar}
                      icon={<UserOutlined />}
                      size={18}
                    />
                    {blog.author?.nickname || blog.author?.username}
                  </span>
                  <span className="meta-divider" />
                  <span className="meta-time">
                    <ClockCircleOutlined />
                    {dayjs(blog.createdAt).fromNow()}
                  </span>
                  <span className="meta-divider" />
                  <span className="meta-stat">
                    <EyeOutlined /> {blog.viewCount ?? 0}
                  </span>
                  <span className="meta-stat">
                    <LikeOutlined /> {blog.likesCount ?? 0}
                  </span>
                  <span className="meta-stat">
                    <MessageOutlined /> {blog.commentCount ?? 0}
                  </span>
                  {blog.tags?.slice(0, 3).map((tag) => (
                    <Tag key={tag} className="result-tag">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
              {blog.cover && (
                <div className="result-cover">
                  <img src={blog.cover} alt="" />
                </div>
              )}
            </Link>
          ))}
          {blogsTotal > PAGE_SIZE && (
            <div className="result-pagination">
              <Pagination
                current={blogsPage}
                total={blogsTotal}
                pageSize={PAGE_SIZE}
                onChange={handleBlogsPageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  // ─── 动态结果列表 ──────────────────────────────────────────────────────────
  const MomentResults = () => (
    <div className="result-section">
      {momentsLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="result-skeleton">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </div>
        ))
      ) : moments.length === 0 ? (
        <CustomEmpty tip={`没有找到关于"${keyword}"的动态`} />
      ) : (
        <>
          {moments.map((moment) => (
            <Link
              key={moment.id}
              to={`/moments/${moment.id}`}
              className="moment-result-item"
            >
              <Avatar
                src={moment.author?.avatar}
                icon={<UserOutlined />}
                size={36}
                className="moment-avatar"
              />
              <div className="moment-body">
                <div className="moment-author-row">
                  <span className="moment-author">
                    {moment.author?.nickname || moment.author?.username}
                  </span>
                  {moment.topic && (
                    <Tag className="moment-topic-tag">#{moment.topic.name}</Tag>
                  )}
                  <span className="moment-time">
                    {dayjs(moment.createdAt).fromNow()}
                  </span>
                </div>
                <div className="moment-content">
                  {highlightKeyword(moment.content, keyword)}
                </div>
                {moment.images && moment.images.length > 0 && (
                  <div
                    className={`moment-images count-${Math.min(moment.images.length, 3)}`}
                  >
                    {moment.images.slice(0, 3).map((img, idx) => (
                      <img key={idx} src={img} alt="" />
                    ))}
                  </div>
                )}
                <div className="moment-stats">
                  <span>
                    <LikeOutlined /> {moment.likeCount ?? 0}
                  </span>
                  <span>
                    <MessageOutlined /> {moment.commentCount ?? 0}
                  </span>
                  <span>
                    <EyeOutlined /> {moment.viewCount ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {momentsTotal > PAGE_SIZE && (
            <div className="result-pagination">
              <Pagination
                current={momentsPage}
                total={momentsTotal}
                pageSize={PAGE_SIZE}
                onChange={handleMomentsPageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          全部
          {!blogsLoading && !momentsLoading && keyword && (
            <span className="tab-count">{totalCount}</span>
          )}
        </span>
      ),
      children: (
        <>
          {(blogsLoading || blogs.length > 0) && (
            <div className="tab-section">
              <div className="tab-section-title">
                <FileTextOutlined /> 文章
                {!blogsLoading && (
                  <span className="section-count">{blogsTotal}</span>
                )}
              </div>
              <BlogResults />
            </div>
          )}
          {(momentsLoading || moments.length > 0) && (
            <div className="tab-section">
              <div className="tab-section-title">
                <FireOutlined /> 动态
                {!momentsLoading && (
                  <span className="section-count">{momentsTotal}</span>
                )}
              </div>
              <MomentResults />
            </div>
          )}
          {!blogsLoading &&
            !momentsLoading &&
            blogs.length === 0 &&
            moments.length === 0 &&
            keyword && (
              <CustomEmpty
                tip={`没有找到关于"${keyword}"的内容`}
                style={{ padding: '60px 0' }}
              />
            )}
        </>
      ),
    },
    {
      key: 'blogs',
      label: (
        <span>
          <FileTextOutlined /> 文章
          {!blogsLoading && keyword && (
            <span className="tab-count">{blogsTotal}</span>
          )}
        </span>
      ),
      children: <BlogResults />,
    },
    {
      key: 'moments',
      label: (
        <span>
          <FireOutlined /> 动态
          {!momentsLoading && keyword && (
            <span className="tab-count">{momentsTotal}</span>
          )}
        </span>
      ),
      children: <MomentResults />,
    },
  ];

  return (
    <div className="search-page">
      <div className="search-page-header">
        <div className="search-input-wrap">
          <Input
            size="large"
            placeholder="搜索文章、动态..."
            prefix={<SearchOutlined />}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={() => handleSearch(inputValue)}
            allowClear
            onClear={() => {
              setInputValue('');
              navigate('/');
            }}
            className="search-input"
          />
        </div>
        {keyword && (
          <div className="search-summary">
            搜索 <span className="keyword">"{keyword}"</span>
            {!blogsLoading && !momentsLoading && (
              <>
                ，共找到 <span className="count">{totalCount}</span> 条结果
              </>
            )}
          </div>
        )}
      </div>

      {keyword ? (
        <div className="search-content">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            className="search-tabs"
          />
        </div>
      ) : (
        <div className="search-empty-state">
          <SearchOutlined className="empty-icon" />
          <p>输入关键词开始搜索</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
