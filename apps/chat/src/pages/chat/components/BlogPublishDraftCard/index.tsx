import React, { useCallback, useState } from 'react';
import { Alert, Button, Popconfirm, Space, Switch, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { CreateBlogDto } from '@services/generated/model';
import { blogsControllerCreate } from '@services/generated/blogs/blogs';
import { useChat } from '../../context/ChatContext';
import './BlogPublishDraftCard.less';

const { Paragraph, Text } = Typography;

interface Props {
  messageId: string;
  draft: CreateBlogDto;
}

const BlogPublishDraftCard: React.FC<Props> = ({ messageId, draft }) => {
  const { t } = useTranslation();
  const { dispatch, persistCurrentChatToStorage } = useChat();
  const [isPublished, setIsPublished] = useState(Boolean(draft.isPublished));
  const [submitting, setSubmitting] = useState(false);

  const handlePublish = useCallback(async () => {
    setSubmitting(true);
    try {
      const payload: CreateBlogDto = {
        ...draft,
        isPublished,
      };
      const created = await blogsControllerCreate(payload);
      const publishedUpdates = {
        blogPublishDraft: undefined,
        blogPublished: { id: created.id, title: created.title },
      } as const;
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: messageId,
          updates: publishedUpdates,
        },
      });
      persistCurrentChatToStorage({
        id: messageId,
        updates: publishedUpdates,
      });
      message.success(t('chat.blogPublishSuccess'));
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      message.error(t('chat.blogPublishFailed', { reason: err }));
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, draft, isPublished, messageId, persistCurrentChatToStorage, t]);

  return (
    <div className="blog-publish-draft-card">
      <Alert
        type="info"
        showIcon
        message={t('chat.blogPublishCardTitle')}
        description={
          <div className="blog-publish-draft-card__body">
            <Paragraph className="blog-publish-draft-card__field" ellipsis={{ rows: 1 }}>
              <Text type="secondary">{t('chat.blogPublishFieldTitle')}</Text> {draft.title}
            </Paragraph>
            <Paragraph className="blog-publish-draft-card__field" ellipsis={{ rows: 2 }}>
              <Text type="secondary">{t('chat.blogPublishFieldSummary')}</Text> {draft.summary}
            </Paragraph>
            <Paragraph className="blog-publish-draft-card__field">
              <Text type="secondary">{t('chat.blogPublishFieldContent')}</Text>{' '}
              {t('chat.blogPublishContentChars', {
                count: draft.content.length,
              })}
            </Paragraph>
            {draft.tags && draft.tags.length > 0 ? (
              <Paragraph className="blog-publish-draft-card__field" ellipsis>
                <Text type="secondary">{t('chat.blogPublishFieldTags')}</Text>{' '}
                {draft.tags.join(', ')}
              </Paragraph>
            ) : null}
            <Space className="blog-publish-draft-card__actions" wrap>
              <span className="blog-publish-draft-card__switch-label">
                <Switch checked={isPublished} onChange={setIsPublished} size="small" />
                <Text type="secondary">{t('chat.blogPublishAsPublished')}</Text>
              </span>
              <Popconfirm
                title={t('chat.blogPublishConfirmTitle')}
                description={t('chat.blogPublishConfirmDesc')}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
                onConfirm={() => void handlePublish()}
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  loading={submitting}
                >
                  {t('chat.blogPublishButton')}
                </Button>
              </Popconfirm>
            </Space>
          </div>
        }
      />
    </div>
  );
};

export const BlogPublishedBanner: React.FC<{ blogId: number; title: string }> = ({
  blogId,
  title,
}) => {
  const { t } = useTranslation();
  return (
    <div className="blog-publish-draft-card blog-publish-draft-card--done">
      <Alert
        type="success"
        showIcon
        message={t('chat.blogPublishedTitle')}
        description={
          <span>
            <Text strong>{title}</Text>
            {' · '}
            <Link to={`/blogs/${blogId}`}>{t('chat.blogPublishedView')}</Link>
            {' · '}
            <Link to={`/blogs/${blogId}/edit`}>{t('chat.blogPublishedEdit')}</Link>
          </span>
        }
      />
    </div>
  );
};

export default BlogPublishDraftCard;
