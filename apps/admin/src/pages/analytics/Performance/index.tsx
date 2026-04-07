import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Input, Button, Space, Tag, message, Row, Col, Statistic } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { analyticsApi } from '@/services/analyticsApi';
import type { PerformanceMetricResponse, TopPage, QueryPerformanceMetricsParams } from '@/services/analyticsApi';

const { RangePicker } = DatePicker;

const PerformancePage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PerformanceMetricResponse[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [stats, setStats] = useState({
    avgLcp: 0,
    avgFid: 0,
    avgCls: 0,
    avgFcp: 0,
    avgTtfb: 0,
  });

  const [pageUrl, setPageUrl] = useState<string>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: QueryPerformanceMetricsParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      if (pageUrl) params.pageUrl = pageUrl;
      if (dateRange) {
        params.startTime = dateRange[0].toISOString();
        params.endTime = dateRange[1].toISOString();
      }

      const [metricsResponse, topPagesResponse] = await Promise.all([
        analyticsApi.getPerformanceMetrics(params),
        analyticsApi.getTopPages({ limit: 10 }),
      ]);

      setData(metricsResponse.list);
      setPagination((prev) => ({
        ...prev,
        total: metricsResponse.total,
      }));
      setTopPages(topPagesResponse);

      // 计算平均值
      if (metricsResponse.list.length > 0) {
        const avg = metricsResponse.list.reduce(
          (acc, item) => ({
            lcp: acc.lcp + (item.lcp || 0),
            fid: acc.fid + (item.fid || 0),
            cls: acc.cls + (item.cls || 0),
            fcp: acc.fcp + (item.fcp || 0),
            ttfb: acc.ttfb + (item.ttfb || 0),
          }),
          { lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0 },
        );
        const len = metricsResponse.list.length;
        setStats({
          avgLcp: avg.lcp / len,
          avgFid: avg.fid / len,
          avgCls: avg.cls / len,
          avgFcp: avg.fcp / len,
          avgTtfb: avg.ttfb / len,
        });
      }
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
    setPageUrl(undefined);
    setDateRange(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const getPerformanceColor = (value: number, metric: string): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'default';

    if (value <= threshold.good) return 'green';
    if (value <= threshold.poor) return 'orange';
    return 'red';
  };

  const columns: ColumnsType<PerformanceMetricResponse> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'URL',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'LCP (ms)',
      dataIndex: 'lcp',
      key: 'lcp',
      width: 120,
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'lcp')}>
          {value ? value.toFixed(0) : '-'}
        </Tag>
      ),
    },
    {
      title: 'FID (ms)',
      dataIndex: 'fid',
      key: 'fid',
      width: 120,
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'fid')}>
          {value ? value.toFixed(0) : '-'}
        </Tag>
      ),
    },
    {
      title: 'CLS',
      dataIndex: 'cls',
      key: 'cls',
      width: 100,
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'cls')}>
          {value ? value.toFixed(3) : '-'}
        </Tag>
      ),
    },
    {
      title: 'FCP (ms)',
      dataIndex: 'fcp',
      key: 'fcp',
      width: 120,
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'fcp')}>
          {value ? value.toFixed(0) : '-'}
        </Tag>
      ),
    },
    {
      title: 'TTFB (ms)',
      dataIndex: 'ttfb',
      key: 'ttfb',
      width: 120,
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'ttfb')}>
          {value ? value.toFixed(0) : '-'}
        </Tag>
      ),
    },
    {
      title: 'Navigation',
      dataIndex: 'navigationType',
      key: 'navigationType',
      width: 120,
    },
    {
      title: 'Device',
      dataIndex: 'viewportSize',
      key: 'viewportSize',
      width: 120,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const topPagesColumns: ColumnsType<TopPage> = [
    {
      title: 'URL',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      ellipsis: true,
    },
    {
      title: 'Avg LCP',
      dataIndex: 'avgLcp',
      key: 'avgLcp',
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'lcp')}>
          {value.toFixed(0)} ms
        </Tag>
      ),
    },
    {
      title: 'Avg CLS',
      dataIndex: 'avgCls',
      key: 'avgCls',
      render: (value: number) => (
        <Tag color={getPerformanceColor(value, 'cls')}>
          {value.toFixed(3)}
        </Tag>
      ),
    },
    {
      title: 'Views',
      dataIndex: 'count',
      key: 'count',
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg LCP"
              value={stats.avgLcp.toFixed(0)}
              suffix="ms"
              valueStyle={{ color: getPerformanceColor(stats.avgLcp, 'lcp') }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg FID"
              value={stats.avgFid.toFixed(0)}
              suffix="ms"
              valueStyle={{ color: getPerformanceColor(stats.avgFid, 'fid') }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg CLS"
              value={stats.avgCls.toFixed(3)}
              valueStyle={{ color: getPerformanceColor(stats.avgCls, 'cls') }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg FCP"
              value={stats.avgFcp.toFixed(0)}
              suffix="ms"
              valueStyle={{ color: getPerformanceColor(stats.avgFcp, 'fcp') }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Avg TTFB"
              value={stats.avgTtfb.toFixed(0)}
              suffix="ms"
              valueStyle={{ color: getPerformanceColor(stats.avgTtfb, 'ttfb') }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('analytics.topPages')}>
        <Table
          columns={topPagesColumns}
          dataSource={topPages}
          rowKey="pageUrl"
          pagination={false}
          size="small"
        />
      </Card>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder={t('analytics.pageUrl')}
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              style={{ width: 300 }}
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
    </Space>
  );
};

export default PerformancePage;
