import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Input, Button, Space, Tag, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { analyticsApi } from '@/services/analyticsApi';
import type { TrackEventResponse, QueryTrackEventsParams } from '@/services/analyticsApi';

const { RangePicker } = DatePicker;

const TrackEvents: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackEventResponse[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [eventName, setEventName] = useState<string>();
  const [pageUrl, setPageUrl] = useState<string>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: QueryTrackEventsParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      if (eventName) params.eventName = eventName;
      if (pageUrl) params.pageUrl = pageUrl;
      if (dateRange) {
        params.startTime = dateRange[0].toISOString();
        params.endTime = dateRange[1].toISOString();
      }

      const response = await analyticsApi.getTrackEvents(params);
      setData(response.list);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
      }));
    } catch {
      message.error(t('common.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (paginationConfig: { current?: number; pageSize?: number }) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setEventName(undefined);
    setPageUrl(undefined);
    setDateRange(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const columns: ColumnsType<TrackEventResponse> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('analytics.eventName'),
      dataIndex: 'eventName',
      key: 'eventName',
      width: 150,
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: t('analytics.userId'),
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      render: (userId: number) => userId || '-',
    },
    {
      title: t('analytics.anonymousId'),
      dataIndex: 'anonymousId',
      key: 'anonymousId',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('analytics.sessionId'),
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('analytics.pageUrl'),
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('analytics.deviceType'),
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          desktop: 'default',
          mobile: 'green',
          tablet: 'orange',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: t('analytics.browser'),
      dataIndex: 'browser',
      key: 'browser',
      width: 100,
    },
    {
      title: t('analytics.os'),
      dataIndex: 'os',
      key: 'os',
      width: 100,
    },
    {
      title: t('analytics.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Input
            placeholder={t('analytics.eventName')}
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Input
            placeholder={t('analytics.pageUrl')}
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            {t('common.reset')}
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common.total', { total }),
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
};

export default TrackEvents;
