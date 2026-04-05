import React from 'react';
import type { BlogDto } from '@services/generated/model';
import {
  Button,
  Space,
  message,
  Typography,
  Popconfirm,
  Dropdown,
} from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  LikeOutlined,
  StarOutlined,
  PlusOutlined,
  MoreOutlined,
  GlobalOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  blogsControllerRemove,
  blogsControllerUpdate,
} from '../../services/generated/blogs/blogs';
import { formatDate } from '../../utils/date';
import DataList from '@/components/DataList';

const { Text } = Typography;

interface MyBlogsProps {
  blogs: BlogDto[];
  loading: boolean;
  onRefresh: () => void;
}

export const MyBlogs: React.FC<MyBlogsProps> = ({
  blogs,
  loading,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleDelete = async (id: number) => {
    try {
      await blogsControllerRemove(id.toString());
      message.success(t('blog.deleteSuccess'));
      onRefresh();
    } catch (err) {
      console.error('删除博客失败', err);
      message.error(t('blog.deleteFailed'));
    }
  };

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      await blogsControllerUpdate(id.toString(), {
        isPublished: !isPublished,
      } as Parameters<typeof blogsControllerUpdate>[1]);
      message.success(
        isPublished ? t('blog.unpublishSuccess') : t('blog.publishSuccess'),
      );
      onRefresh();
    } catch (err) {
      console.error('操作失败', err);
      message.error(t('common.error'));
    }
  };

  return (
    <div className="my-blogs-list-container">
      <div className="list-header-actions">
        <Text strong className="header-title">
          {t('blog.articles')} ({blogs.length})
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/create')}
          size="middle"
          shape="round"
        >
          {t('blog.writeArticle')}
        </Button>
      </div>

      <DataList
        loading={loading}
        loadingClassName="my-blogs-loading"
        locale={{ emptyText: t('blog.emptyMyBlogs') }}
        dataSource={blogs}
        rowKey={(b) => b.id}
        rowClassName="my-blog-item"
        renderItem={(blog) => (
          <>
            <div className="item-main">
              <div className="item-meta">
                <span className="date">{formatDate(blog.createdAt)}</span>
                <span className="divider">|</span>
                <span className="status-tag">
                  {blog.isPublished ? (
                    <span
                      style={{ color: 'var(--primary-color)', fontWeight: 600 }}
                    >
                      <GlobalOutlined style={{ marginRight: 4 }} />
                      {t('blog.published')}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>
                      <LockOutlined style={{ marginRight: 4 }} />
                      {t('blog.draft')}
                    </span>
                  )}
                </span>
              </div>

              <Typography.Link
                className="item-title"
                onClick={() => navigate(`/blogs/${blog.id}`)}
              >
                {blog.title}
              </Typography.Link>

              <div className="item-stats">
                <Space size={24}>
                  <span className="stat-unit">
                    <EyeOutlined /> {blog.viewCount || 0}
                  </span>
                  <span className="stat-unit">
                    <LikeOutlined /> {blog.likesCount || 0}
                  </span>
                  <span className="stat-unit">
                    <StarOutlined /> {blog.favoritesCount || 0}
                  </span>
                </Space>
              </div>
            </div>

            <div className="item-actions">
              <Space size={16}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                >
                  {t('common.edit')}
                </Button>

                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'publish',
                        label: blog.isPublished
                          ? t('blog.toDraft')
                          : t('blog.publishArticle'),
                        onClick: () =>
                          handleTogglePublish(blog.id, blog.isPublished),
                      },
                      {
                        key: 'delete',
                        danger: true,
                        label: (
                          <Popconfirm
                            title={t('blog.confirmDeleteTitle')}
                            onConfirm={() => handleDelete(blog.id)}
                            okText={t('common.confirm')}
                            cancelText={t('common.cancel')}
                          >
                            <span>{t('blog.deleteArticle')}</span>
                          </Popconfirm>
                        ),
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </div>
          </>
        )}
      />
    </div>
  );
};
