import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Space, Button, Tag, Input, message } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/services/analyticsApi';
import type { UserItem } from '@/services/analyticsApi';

const { RangePicker } = DatePicker;

const UserList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchData = async () => {
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

      const response = await analyticsApi.getUserList(params as any);
      let list = response.list;

      // 本地过滤
      if (searchText) {
        list = list.filter(
          (item) =>
            item.anonymousId.toLowerCase().includes(searchText.toLowerCase()) ||
            (item.userId && String(item.userId).includes(searchText)),
        );
      }

      setData(list);
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
  }, [pagination.current, pagination.pageSize, dateRange]);

  const handleTableChange = (paginationConfig: { current?: number; pageSize?: number }) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    }));
  };

  const columns: ColumnsType<UserItem> = [
    {
      title: 'Anonymous ID',
      dataIndex: 'anonymousId',
      key: 'anonymousId',
      width: 200,
      ellipsis: true,
      render: (id: string) => <Tag>{id.slice(0, 12)}...</Tag>,
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      render: (id: number | null) => (id ? String(id) : '-'),
    },
    {
      title: t('analytics.eventCount'),
      dataIndex: 'eventCount',
      key: 'eventCount',
      width: 100,
      sorter: (a, b) => a.eventCount - b.eventCount,
    },
    {
      title: t('analytics.pageCount'),
      dataIndex: 'pageCount',
      key: 'pageCount',
      width: 100,
      sorter: (a, b) => a.pageCount - b.pageCount,
    },
    {
      title: t('analytics.firstVisit'),
      dataIndex: 'firstVisit',
      key: 'firstVisit',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('analytics.lastVisit'),
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/analytics/users/${record.anonymousId}`)}
        >
          {t('common.view')}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Space wrap style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Input
          placeholder="Search by ID..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          allowClear
          prefix={<SearchOutlined />}
        />
        <Button type="primary" onClick={fetchData}>
          {t('common.search')}
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="anonymousId"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common.total', { total }),
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default UserList;
