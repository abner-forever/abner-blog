import { useEffect, useState, useRef, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  DatePicker,
  message,
  Result,
  Button,
  Segmented,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  EyeOutlined,
  TagsOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { getBlogAPI } from "@/services/generated/admin";
import type {
  AdminControllerGetDailyViewsParams,
  AdminControllerGetDailyViewsType,
  DailyViewItemDto,
} from "@/services/generated/model";
import "./index.less";

const api = getBlogAPI();

/** 与后端 AdminService.getDashboardStats 返回一致（生成客户端误标为 void） */
interface DashboardBlogStats {
  userCount: number;
  blogCount: number;
  blogViewCount: number;
}

interface DashboardMomentStats {
  momentCount: number;
  topicCount: number;
}

const Dashboard: React.FC = () => {
  const [blogStats, setBlogStats] = useState<DashboardBlogStats>({
    userCount: 0,
    blogCount: 0,
    blogViewCount: 0,
  });
  const [momentStats, setMomentStats] = useState<DashboardMomentStats>({
    momentCount: 0,
    topicCount: 0,
  });
  const [dailyViews, setDailyViews] = useState<DailyViewItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] =
    useState<AdminControllerGetDailyViewsType>("all");
  const chartRef = useRef<ReactECharts>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminControllerGetDailyViewsParams = { type: viewType };
      const [blogRaw, momentRaw, viewsData] = await Promise.all([
        api.adminControllerGetDashboardStats(),
        api.adminControllerGetMomentsStats(),
        api.adminControllerGetDailyViews(params),
      ]);

      const blogParsed = blogRaw as unknown as DashboardBlogStats | undefined;
      const momentParsed =
        momentRaw as unknown as DashboardMomentStats | undefined;

      setBlogStats(
        blogParsed ?? { userCount: 0, blogCount: 0, blogViewCount: 0 },
      );
      setMomentStats(
        momentParsed ?? { momentCount: 0, topicCount: 0 },
      );
      setDailyViews(viewsData ?? []);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        axiosError.response?.data?.message || axiosError.message || "加载失败";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  // 访问趋势图
  const getDailyViewOption = () => {
    const dates = dailyViews.map((item) => item.date?.slice(5) || "");
    const isAll = viewType === "all";
    const pvData = dailyViews.map((item) => item.pv ?? item.views ?? 0);
    const uvData = dailyViews.map((item) => item.uv ?? 0);

    const series = isAll
      ? [
          {
            name: "PV",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: { color: "#1890ff", width: 2 },
            itemStyle: { color: "#1890ff" },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(24, 144, 255, 0.15)" },
                { offset: 1, color: "rgba(24, 144, 255, 0.02)" },
              ]),
            },
            data: pvData,
          },
          {
            name: "UV",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: { color: "#52c41a", width: 2 },
            itemStyle: { color: "#52c41a" },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(82, 196, 26, 0.15)" },
                { offset: 1, color: "rgba(82, 196, 26, 0.02)" },
              ]),
            },
            data: uvData,
          },
        ]
      : [
          {
            name: viewType === "pv" ? "PV" : "UV",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: {
              color: viewType === "pv" ? "#1890ff" : "#52c41a",
              width: 2,
            },
            itemStyle: { color: viewType === "pv" ? "#1890ff" : "#52c41a" },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color:
                    viewType === "pv"
                      ? "rgba(24, 144, 255, 0.15)"
                      : "rgba(82, 196, 26, 0.15)",
                },
                {
                  offset: 1,
                  color:
                    viewType === "pv"
                      ? "rgba(24, 144, 255, 0.02)"
                      : "rgba(82, 196, 26, 0.02)",
                },
              ]),
            },
            data: viewType === "pv" ? pvData : uvData,
          },
        ];

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e8e8e8",
        textStyle: { color: "#333" },
        padding: [8, 12],
      },
      legend: isAll ? { data: ["PV", "UV"], top: 5 } : undefined,
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: isAll ? "15%" : "15%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: "#d9d9d9" } },
        axisLabel: { color: "#666", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisLabel: { color: "#666" },
        splitLine: { lineStyle: { color: "#f0f0f0" } },
      },
      series,
    };
  };

  // 博客分类饼图
  const getCategoryOption = () => {
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#e8e8e8",
        textStyle: { color: "#333" },
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: { color: "#666" },
      },
      series: [
        {
          name: "博客分类",
          type: "pie",
          radius: ["45%", "70%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          data: [
            { value: 35, name: "技术分享", itemStyle: { color: "#1890ff" } },
            { value: 25, name: "生活随笔", itemStyle: { color: "#52c41a" } },
            { value: 20, name: "项目实战", itemStyle: { color: "#faad14" } },
            { value: 15, name: "经验总结", itemStyle: { color: "#722ed1" } },
            { value: 5, name: "其他", itemStyle: { color: "#8c8c8c" } },
          ],
        },
      ],
    };
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>数据概览</h2>
        <DatePicker.RangePicker format="YYYY-MM-DD" />
      </div>

      {/* 文章数据 */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: "#1890ff", marginBottom: 12 }}>文章数据</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8 }}>
              <Statistic
                title="用户总数"
                value={blogStats.userCount || 0}
                prefix={<UserOutlined style={{ color: "#1890ff" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8 }}>
              <Statistic
                title="文章总数"
                value={blogStats.blogCount || 0}
                prefix={<FileTextOutlined style={{ color: "#52c41a" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8 }}>
              <Statistic
                title="文章浏览量"
                value={blogStats.blogViewCount || 0}
                prefix={<EyeOutlined style={{ color: "#faad14" }} />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 闲聊数据 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: "#722ed1", marginBottom: 12 }}>闲聊数据</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8 }}>
              <Statistic
                title="闲聊总数"
                value={momentStats.momentCount || 0}
                prefix={<MessageOutlined style={{ color: "#722ed1" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: 8 }}>
              <Statistic
                title="话题总数"
                value={momentStats.topicCount || 0}
                prefix={<TagsOutlined style={{ color: "#eb2f96" }} />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="访问趋势"
            extra={
              <Segmented
                value={viewType}
                onChange={(val) =>
                  setViewType(val as AdminControllerGetDailyViewsType)
                }
                options={[
                  { label: "全部", value: "all" },
                  { label: "PV", value: "pv" },
                  { label: "UV", value: "uv" },
                ]}
              />
            }
            style={{ borderRadius: 8 }}
          >
            <ReactECharts
              ref={chartRef}
              option={getDailyViewOption()}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="博客分类" style={{ borderRadius: 8 }}>
            <ReactECharts
              option={getCategoryOption()}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
