import { useState } from 'react';
import { Space, Pagination, Skeleton, Row, Col, Card, Button } from 'antd';
import CustomEmpty from '@/components/CustomEmpty';
import {
  EyeOutlined,
  EditOutlined,
  FireOutlined,
  MessageOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentLocale } from '@/i18n';
import { getSiteBrand } from '@/config/site';
import { useQuery } from '@tanstack/react-query';
import { blogsControllerFindAll, blogsControllerGetRecommended } from '@services/generated/blogs/blogs';
import { getBlogCoverStyle } from '@/utils/blogCover';
import dayjs from 'dayjs';
import './index.less';

const BlogList = () => {
  const { t } = useTranslation();
  const { title: siteTitle } = getSiteBrand(getCurrentLocale());
  const copyrightYear = new Date().getFullYear();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get('search');

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recommend');

  const {
    data: recommendedBlogs = [],
  } = useQuery({
    queryKey: ['blog-list', 'recommended'],
    queryFn: async () => {
      const data = await blogsControllerGetRecommended();
      return Array.isArray(data) ? data.slice(0, 5) : [];
    },
  });

  const {
    data: blogListData,
    isLoading,
    isFetching,
    refetch: refetchBlogList,
  } = useQuery({
    queryKey: [
      'blog-list',
      currentPage,
      selectedTag,
      searchKeyword,
      sortBy,
    ],
    queryFn: async () => {
      const params: {
        page: number;
        pageSize: number;
        tag?: string;
        search?: string;
        sortBy?: string;
      } = { page: currentPage, pageSize: 10 };
      if (selectedTag) params.tag = selectedTag;
      if (searchKeyword) params.search = searchKeyword;
      if (sortBy !== 'recommend') params.sortBy = sortBy;
      return blogsControllerFindAll(params);
    },
  });

  const blogs = blogListData?.list || [];
  const total = blogListData?.total || 0;
  const loading = isLoading || isFetching;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setCurrentPage(1);
  };

  const handleSortChange = (nextSort: string) => {
    const shouldManualRefresh =
      sortBy === nextSort && selectedTag === null && currentPage === 1;
    setSortBy(nextSort);
    setSelectedTag(null);
    setCurrentPage(1);
    if (shouldManualRefresh) {
      void refetchBlogList();
    }
  };

  const highlightText = (text: string, keyword: string | null) => {
    if (!keyword || !text) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <span key={i} className="highlight">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  const allTags = Array.from(
    new Set(
      blogs
        .flatMap((blog) => blog.tags || [])
        .filter((tag) => tag && tag.trim()),
    ),
  ).slice(0, 10);

  return (
    <div className="blog-list-page">
      <Row gutter={20}>
        {/* 左侧文章列表 */}
        <Col xs={24} sm={24} md={17} lg={18} className="main-area">
          <div className="list-container">
            {/* 列表头部过滤器 */}
            <div className="list-header">
              {searchKeyword ? (
                <div className="search-result-info">
                  {t('blog.searchResult')}"{searchKeyword}"
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('search');
                      navigate(`/?${newParams.toString()}`);
                    }}
                  >
                    {t('blog.clearSearch')}
                  </Button>
                </div>
              ) : (
                <nav className="list-nav">
                  <span
                    className={`nav-item ${sortBy === 'recommend' ? 'active' : ''}`}
                    onClick={() => handleSortChange('recommend')}
                  >
                    {t('blog.recommend')}
                  </span>
                  <span
                    className={`nav-item ${sortBy === 'latest' ? 'active' : ''}`}
                    onClick={() => handleSortChange('latest')}
                  >
                    {t('blog.latest')}
                  </span>
                  <span
                    className={`nav-item ${sortBy === 'hot' ? 'active' : ''}`}
                    onClick={() => handleSortChange('hot')}
                  >
                    {t('blog.hot')}
                  </span>
                </nav>
              )}
            </div>

            {/* 文章列表 */}
            <div className="article-list">
              {loading ? (
                <div className="skeleton-container">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="skeleton-item"
                      style={{ padding: '20px' }}
                    >
                      <Skeleton active avatar paragraph={{ rows: 2 }} />
                    </div>
                  ))}
                </div>
              ) : blogs.length > 0 ? (
                <>
                  {blogs.map((blog) => (
                    <div key={blog.id} className="article-item">
                      <Link to={`/blogs/${blog.id}`} className="article-content">
                        <div className="article-meta">
                          <span className="author-name">
                            {blog.author?.nickname ||
                              blog.author?.username ||
                              t('common.anonymous')}
                          </span>
                          <span className="divider">|</span>
                          <span className="date">
                            {dayjs(blog.createdAt).format('YYYY-MM-DD')}
                          </span>
                          {blog.tags?.[0] && (
                            <>
                              <span className="divider">|</span>
                              <span className="tag">{blog.tags[0]}</span>
                            </>
                          )}
                        </div>
                        <div
                          className="article-title"
                        >
                          {highlightText(blog.title, searchKeyword)}
                        </div>
                        <div className="article-excerpt">
                          {highlightText(
                            blog.summary ||
                              (blog.content || '')
                                .replace(/<[^>]+>/g, '')
                                .substring(0, 100),
                            searchKeyword,
                          )}
                          ...
                        </div>
                        <div className="article-actions">
                          <Space size={20}>
                            <span className="action-item">
                              <EyeOutlined /> {blog.viewCount || 0}
                            </span>
                            <span className="action-item">
                              <LikeOutlined /> {blog.likesCount || 0}
                            </span>
                            <span className="action-item">
                              <MessageOutlined /> {blog.commentCount || 0}
                            </span>
                          </Space>
                        </div>
                      </Link>
                      {/* 封面图：有则展示真实图片，无则展示渐变兜底 */}
                      <div className="article-thumbnail">
                        <div
                          className="cover-box"
                          style={getBlogCoverStyle(blog.cover, blog.id)}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pagination-box">
                    <Pagination
                      current={currentPage}
                      total={total}
                      pageSize={10}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                  </div>
                </>
              ) : (
                <CustomEmpty
                  tip={t('blog.emptyList')}
                  style={{ padding: '100px 0' }}
                />
              )}
            </div>
          </div>
        </Col>

        {/* 右侧侧边栏 */}
        <Col xs={0} sm={0} md={7} lg={6} className="sidebar-area">
          {/* 用户问候卡片 */}
          <Card variant="borderless" className="sidebar-card greeting-card">
            <div className="greeting-header">
              <div className="greeting-text">
                <div className="title">{t('blog.greetingTitle')}</div>
                <div className="subtitle">{t('blog.greetingSubtitle')}</div>
              </div>
            </div>
          </Card>

          <Card variant="borderless" className="sidebar-card promo-card">
            <div className="promo-content">
              <div className="promo-text">
                <h3 style={{ margin: 0 }}>{t('blog.firstBlogTitle')}</h3>
                <p style={{ margin: '4px 0 16px', color: '#8a919f' }}>
                  {t('blog.firstBlogSubtitle')}
                </p>
              </div>
              <Link to="/create">
                <Button
                  type="primary"
                  block
                  icon={<EditOutlined />}
                  className="write-btn"
                >
                  {t('blog.startWriting')}
                </Button>
              </Link>
            </div>
          </Card>

          <Card
            variant="borderless"
            className="sidebar-card hot-card"
            title={
              <div className="card-title">
                <FireOutlined style={{ color: '#ff7d00' }} />{' '}
                {t('blog.hotArticles')}
              </div>
            }
          >
            <div className="hot-list">
              {recommendedBlogs.map((blog, index) => (
                <div key={blog.id} className="hot-item">
                  <Link to={`/blogs/${blog.id}`} className="hot-link">
                    <span className={`rank rank-${index + 1}`}>
                      {index + 1}
                    </span>
                    <span className="title">{blog.title}</span>
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          {/* 热门标签 */}
          <Card
            variant="borderless"
            className="sidebar-card tag-card"
            title={t('blog.hotTags')}
          >
            <div className="tag-cloud">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          {/* 页脚链接 */}
          <div className="sidebar-footer">
            <div className="footer-links">
              <Link to="#">{t('blog.aboutUs')}</Link>
              <Link to="#">{t('blog.terms')}</Link>
              <Link to="#">{t('blog.privacy')}</Link>
            </div>
            <div className="copyright">
              {t('footer.copyrightMinimal', { year: copyrightYear, title: siteTitle })}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default BlogList;
