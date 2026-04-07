import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Space, Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import { analyticsApi } from '@/services/analyticsApi';
import type { OverviewStats, EventTrend, PopularPage } from '@/services/analyticsApi';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [trendData, setTrendData] = useState<EventTrend[]>([]);
  const [popularPages, setPopularPages] = useState<PopularPage[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [startTime, endTime] = dateRange;
      const params = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const [overviewData, trendDataResult, pagesData] = await Promise.all([
        analyticsApi.getOverview(params),
        analyticsApi.getEventTrend({ ...params, granularity: 'day' }),
        analyticsApi.getPopularPages({ limit: 10 }),
      ]);

      setOverview(overviewData);
      setTrendData(trendDataResult);
      setPopularPages(pagesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // 事件趋势图配置
  const getTrendOption = () => {
    const times = trendData.map((d) => d.time);
    const series: { name: string; data: number[] }[] = [];
    const eventNames = ['page_view', 'click', 'js_error'];

    eventNames.forEach((name) => {
      const data = trendData.map((d) => (d[name] as number) || 0);
      if (data.some((v) => v > 0)) {
        series.push({ name, data });
      }
    });

    return {
      title: { text: t('analytics.eventTrend'), left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: series.map((s) => s.name) },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value' },
      series: series.map((s) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
      })),
    };
  };

  const columns: ColumnsType<PopularPage> = [
    {
      title: 'URL',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      ellipsis: true,
    },
    {
      title: 'PV',
      dataIndex: 'pv',
      key: 'pv',
      width: 100,
      sorter: (a, b) => a.pv - b.pv,
    },
    {
      title: 'UV',
      dataIndex: 'uv',
      key: 'uv',
      width: 100,
      sorter: (a, b) => a.uv - b.uv,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title={t('analytics.totalPv')}
              value={overview?.totalPv || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title={t('analytics.uv')}
              value={overview?.uv || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title={t('analytics.clickEvents')}
              value={overview?.clickEvents || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title={t('analytics.jsErrors')}
              value={overview?.errorEvents || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title={t('analytics.totalEvents')}
              value={overview?.totalEvents || 0}
            />
          </Card>
        </Col>
      </Row>

      <Card loading={loading}>
        <ReactECharts
          option={getTrendOption()}
          style={{ height: 300 }}
          opts={{ renderer: 'canvas' }}
        />
      </Card>

      <Card title={t('analytics.popularPages')} loading={loading}>
        <Table
          columns={columns}
          dataSource={popularPages}
          rowKey="pageUrl"
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  );
};

export default Dashboard;
