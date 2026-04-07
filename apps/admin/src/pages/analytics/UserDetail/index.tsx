import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Space, Button, Tag, Select, message, Descriptions, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/services/analyticsApi';
import type { TrackEventResponse } from '@/services/analyticsApi';

const { RangePicker } = DatePicker;

const UserDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { anonymousId } = useParams<{ anonymousId: string }>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackEventResponse[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [eventName, setEventName] = useState<string>();

  const fetchData = async () => {
    if (!anonymousId) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      if (dateRange) {
        params.startTime = dateRange[0].toISOString();
        params.endTime = dateRange[1].toISOString();
      }

      if (eventName) {
        params.eventName = eventName;
      }

      const response = await analyticsApi.getUserBehavior({
        anonymousId,
        ...params,
      } as any);

      setData(response.list);
      setPagination((prev) => ({ ...prev, total: response.total }));
    } catch {
      message.error(t('common.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, dateRange, eventName, anonymousId]);

  const handleTableChange = (paginationConfig: { current?: number; pageSize?: number }) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 50,
    }));
  };

  const getEventTagColor = (name: string) => {
    switch (name) {
      case 'page_view':
        return 'blue';
      case 'click':
        return 'green';
      case 'js_error':
      case 'unhandled_promise_error':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<TrackEventResponse> = [
    {
      title: t('analytics.eventName'),
      dataIndex: 'eventName',
      key: 'eventName',
      width: 150,
      render: (name: string) => (
        <Tag color={getEventTagColor(name)}>{name}</Tag>
      ),
    },
    {
      title: t('analytics.pageUrl'),
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Element',
      key: 'element',
      width: 150,
      render: (_, record) => {
        if (record.eventName !== 'click' || !record.eventData) return '-';
        const { elementTag, elementText } = record.eventData as Record<string, unknown>;
        return elementText ? `${elementTag || '?'}: ${String(elementText).slice(0, 30)}` : '-';
      },
    },
    {
      title: t('analytics.deviceType'),
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Browser',
      dataIndex: 'browser',
      key: 'browser',
      width: 80,
    },
    {
      title: 'OS',
      dataIndex: 'os',
      key: 'os',
      width: 80,
    },
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  if (!anonymousId) {
    return <Card>{t('common.noData')}</Card>;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Descriptions column={2}>
          <Descriptions.Item label="Anonymous ID">
            <Tag>{anonymousId}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="User ID">
            {data[0]?.userId || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
          <Select
            placeholder="Event type"
            value={eventName}
            onChange={setEventName}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="page_view">page_view</Select.Option>
            <Select.Option value="click">click</Select.Option>
            <Select.Option value="js_error">js_error</Select.Option>
            <Select.Option value="unhandled_promise_error">unhandled_promise_error</Select.Option>
          </Select>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common.back')}
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
      </Card>
    </Space>
  );
};

export default UserDetail;
