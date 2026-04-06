import type { FC } from 'react';
import classNames from 'classnames';
import { Button, Spin, Empty, Typography, Image, Space, Tag, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataList from '@/components/DataList';
import {
  getNotifications,
  markNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from '@services/social';
import './index.less';

const { Text, Paragraph } = Typography;

function payloadPath(n: NotificationItem): string | null {
  const p = n.payload;
  if (!p || typeof p !== 'object') return null;
  const path = p.path;
  return typeof path === 'string' ? path : null;
}

function payloadImages(n: NotificationItem): string[] {
  const p = n.payload;
  if (!p || typeof p !== 'object') return [];
  const urls = p.imageUrls;
  if (!Array.isArray(urls)) return [];
  return urls.filter((u): u is string => typeof u === 'string');
}

/** 系统通知条目携带的公告 ID，用于进入全文页 */
function systemAnnouncementId(n: NotificationItem): number | null {
  if (n.type !== 'SYSTEM') return null;
  const p = n.payload;
  if (!p || typeof p !== 'object') return null;
  if (p.kind !== 'system') return null;
  const aid = p.announcementId;
  return typeof aid === 'number' && Number.isFinite(aid) ? aid : null;
}

function systemPayloadRevision(n: NotificationItem): number {
  if (n.type !== 'SYSTEM') return 0;
  const p = n.payload;
  if (!p || typeof p !== 'object') return 0;
  const r = p.revision;
  return typeof r === 'number' && Number.isFinite(r) ? r : 0;
}

function isSystemNotificationRecalled(n: NotificationItem): boolean {
  if (n.type !== 'SYSTEM') return false;
  const p = n.payload;
  return !!(p && typeof p === 'object' && p.recalled === true);
}

const NotificationsPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 1],
    queryFn: () => getNotifications(1, 50),
  });

  const markOneMut = useMutation({
    mutationFn: (id: number) => markNotificationsRead({ ids: [id] }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'feed-unread'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => markNotificationsRead({ markAll: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'feed-unread'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'feed-unread'] });
    },
  });

  const list = data?.list ?? [];

  const handleClick = (n: NotificationItem) => {
    if (!n.readAt) {
      markOneMut.mutate(n.id);
    }
    const annId = systemAnnouncementId(n);
    if (annId !== null) {
      navigate(`/notifications/announcements/${annId}`);
      return;
    }
    const path = payloadPath(n);
    if (path && path !== '/notifications') {
      navigate(path);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page__head">
        <h1 className="notifications-page__title">{t('social.notifications')}</h1>
        <Button
          type="link"
          onClick={() => markAllMut.mutate()}
          loading={markAllMut.isPending}
          disabled={list.length === 0}
        >
          {t('social.markAllRead')}
        </Button>
      </div>
      {isLoading ? (
        <div className="notifications-page__center">
          <Spin />
        </div>
      ) : list.length === 0 ? (
        <Empty description={t('social.noNotifications')} />
      ) : (
        <DataList
          className="notifications-page__list"
          dataSource={list}
          rowKey={(n) => n.id}
          rowClassName={(n) =>
            classNames('notifications-page__item', {
              'notifications-page__item--unread': !n.readAt,
              'notifications-page__item--recalled': isSystemNotificationRecalled(n),
            })
          }
          rowProps={(n) => ({ onClick: () => handleClick(n) })}
          renderItem={(n) => {
            const imgs = payloadImages(n);
            const unread = !n.readAt;
            const sysRecalled = isSystemNotificationRecalled(n);
            const rev = systemPayloadRevision(n);
            const showUpdatedTag =
              n.type === 'SYSTEM' && !sysRecalled && rev > 1;
            return (
              <div className="notifications-page__item-body">
                <div className="notifications-page__item-title">
                  <Space wrap>
                    <Text strong={unread}>{n.title}</Text>
                    {sysRecalled ? (
                      <Tag color="default">{t('social.notificationRecalledTag')}</Tag>
                    ) : null}
                    {showUpdatedTag ? (
                      <Tag color="processing">{t('social.announcementContentUpdated')}</Tag>
                    ) : null}
                    {unread && !sysRecalled ? (
                      <span className="notifications-page__dot" />
                    ) : null}
                  </Space>
                  <Popconfirm
                    title={t('social.confirmDeleteNotification')}
                    onConfirm={() => deleteMut.mutate(n.id)}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopPropagation();
                      }}
                    />
                  </Popconfirm>
                </div>
                <div className="notifications-page__item-desc">
                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    className="notifications-page__summary"
                  >
                    {sysRecalled
                      ? t('social.notificationRecalledSummary')
                      : n.summary}
                  </Paragraph>
                  {imgs.length > 0 && (
                    <Image.PreviewGroup>
                      <Space wrap className="notifications-page__imgs">
                        {imgs.slice(0, 4).map((src) => (
                          <Image
                            key={src}
                            src={src}
                            width={72}
                            height={72}
                            style={{ objectFit: 'cover' }}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  )}
                  <Text type="secondary" className="notifications-page__time">
                    {new Date(n.createdAt).toLocaleString()}
                  </Text>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
