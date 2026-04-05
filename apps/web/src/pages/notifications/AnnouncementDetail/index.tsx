import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Button, Spin, Typography, Image, Space, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getSystemAnnouncement } from '@services/social';
import type { RootState } from '@/store';
import CustomEmpty from '@/components/CustomEmpty';
import './index.less';

const { Text } = Typography;

const AnnouncementDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useSelector((s: RootState) => s.auth.token);
  const numericId = id ? Number.parseInt(id, 10) : Number.NaN;
  const validId = Number.isFinite(numericId) && numericId > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['system-announcement', numericId, token],
    queryFn: () => getSystemAnnouncement(numericId),
    enabled: validId && !!token,
  });

  const handleBack = () => {
    navigate('/notifications');
  };

  if (!validId) {
    return (
      <div className="announcement-detail">
        <div className="announcement-detail__toolbar">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('social.backToNotifications')}
          </Button>
        </div>
        <CustomEmpty tip={t('social.announcementNotFound')} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="announcement-detail announcement-detail--center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="announcement-detail">
        <div className="announcement-detail__toolbar">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('social.backToNotifications')}
          </Button>
        </div>
        <CustomEmpty tip={t('social.announcementNotFound')} />
      </div>
    );
  }

  const timeLabel = data.publishedAt
    ? new Date(data.publishedAt).toLocaleString()
    : new Date(data.createdAt).toLocaleString();

  if (data.recalled) {
    return (
      <div className="announcement-detail">
        <div className="announcement-detail__toolbar">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('social.backToNotifications')}
          </Button>
        </div>
        <article
          className="announcement-detail__article announcement-detail__article--recalled"
          aria-label={t('social.announcementDetail')}
        >
          <h1 className="announcement-detail__title">{data.title}</h1>
          <Text type="secondary" className="announcement-detail__meta">
            {timeLabel}
          </Text>
          <Alert type="warning" showIcon message={t('social.announcementRecalled')} />
        </article>
      </div>
    );
  }

  return (
    <div className="announcement-detail">
      <div className="announcement-detail__toolbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {t('social.backToNotifications')}
        </Button>
      </div>
      <article
        className="announcement-detail__article"
        aria-label={t('social.announcementDetail')}
      >
        <h1 className="announcement-detail__title">{data.title}</h1>
        <Text type="secondary" className="announcement-detail__meta">
          {timeLabel}
        </Text>
        {typeof data.notifyRevision === 'number' && data.notifyRevision > 1 ? (
          <Alert
            type="info"
            showIcon
            className="announcement-detail__rev-banner"
            message={t('social.announcementContentUpdated')}
          />
        ) : null}
        <div
          className="announcement-detail__body"
          dangerouslySetInnerHTML={{ __html: data.bodyRich }}
        />
        {(data.imageUrls ?? []).length > 0 && (
          <div className="announcement-detail__gallery">
            <Image.PreviewGroup>
              <Space wrap size="middle">
                {(data.imageUrls ?? []).map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    className="announcement-detail__gallery-img"
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}
      </article>
    </div>
  );
};

export default AnnouncementDetail;
