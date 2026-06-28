import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Statistic, Row, Col, Spin, Typography, Button, Space } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  BlockOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { pageApi, statsApi } from "@/services/api";
import "./index.less";

const { Title, Paragraph, Text } = Typography;

interface Stats {
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  archivedPages: number;
  totalPV: number;
}

const HomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPages: 0,
    publishedPages: 0,
    draftPages: 0,
    archivedPages: 0,
    totalPV: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [totalRes, publishedRes, draftRes, archivedRes] = await Promise.all([
          pageApi.list({ pageSize: 1 }),
          pageApi.list({ pageSize: 1, status: "published" }),
          pageApi.list({ pageSize: 1, status: "draft" }),
          pageApi.list({ pageSize: 1, status: "archived" }),
        ]);

        // Aggregate total PV from all pages
        let totalPV = 0;
        try {
          const allPages = await pageApi.list({ pageSize: totalRes.total });
          if (allPages.list.length > 0) {
            const ids = allPages.list.map((p) => p.id);
            const pvMap = await statsApi.getBatch(ids);
            totalPV = Object.values(pvMap).reduce((sum, v) => sum + (v as number), 0);
          }
        } catch {
          // PV data is non-critical
        }

        setStats({
          totalPages: totalRes.total,
          publishedPages: publishedRes.total,
          draftPages: draftRes.total,
          archivedPages: archivedRes.total,
          totalPV,
        });
      } catch {
        // Stats loading failed, use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      key: "total",
      title: "总页面数",
      value: stats.totalPages,
      icon: <FileTextOutlined />,
      color: "#2f81f7",
      bg: "rgba(47, 129, 247, 0.08)",
    },
    {
      key: "published",
      title: "已发布",
      value: stats.publishedPages,
      icon: <CheckCircleOutlined />,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.08)",
    },
    {
      key: "draft",
      title: "草稿",
      value: stats.draftPages,
      icon: <EditOutlined />,
      color: "#eab308",
      bg: "rgba(234, 179, 8, 0.08)",
    },
    {
      key: "pv",
      title: "总访问量",
      value: stats.totalPV,
      icon: <EyeOutlined />,
      color: "#a855f7",
      bg: "rgba(168, 85, 247, 0.08)",
    },
  ];

  if (loading) {
    return (
      <div className="home-dashboard">
        <div className="home-dashboard__ambient">
          <div className="home-dashboard__ambient-glow home-dashboard__ambient-glow--1" />
          <div className="home-dashboard__ambient-glow home-dashboard__ambient-glow--2" />
        </div>
        <div className="home-dashboard__loading">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      {/* ── Ambient ── */}
      <div className="home-dashboard__ambient">
        <div className="home-dashboard__ambient-glow home-dashboard__ambient-glow--1" />
        <div className="home-dashboard__ambient-glow home-dashboard__ambient-glow--2" />
      </div>

      {/* ── Header ── */}
      <header className="home-dashboard__header">
        <h1 className="home-dashboard__title">首页</h1>
        <span className="home-dashboard__subtitle">龙码低代码平台</span>
      </header>

      {/* ── Content ── */}
      <div className="home-dashboard__content">
        {/* Welcome Card */}
        <Card className="home-dashboard__welcome" bordered={false}>
          <div className="home-dashboard__welcome-inner">
            <div className="home-dashboard__welcome-text">
              <Title level={3} className="home-dashboard__welcome-title">
                欢迎使用龙码低代码平台
              </Title>
              <Paragraph className="home-dashboard__welcome-desc">
                龙码是一款基于 GrapesJS Studio SDK 构建的低代码页面搭建平台。
                通过可视化拖拽编辑，快速构建落地页、营销活动页面和微站点。
                无需编写代码，即可创建响应式、多语言的企业级页面。
              </Paragraph>
              <Space size="middle" className="home-dashboard__welcome-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate("/pages")}
                  className="home-dashboard__action-btn"
                >
                  新建页面
                </Button>
                <Button
                  icon={<RobotOutlined />}
                  onClick={() => navigate("/editor/ai-create")}
                  className="home-dashboard__action-btn"
                >
                  AI 页面生成
                </Button>
              </Space>
            </div>
            <div className="home-dashboard__welcome-illustration">
              <div className="home-dashboard__feature-grid">
                <div className="home-dashboard__feature-item">
                  <div className="home-dashboard__feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" /><path d="M9 21V9" />
                    </svg>
                  </div>
                  <span>可视化编辑</span>
                </div>
                <div className="home-dashboard__feature-item">
                  <div className="home-dashboard__feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10" />
                    </svg>
                  </div>
                  <span>多语言支持</span>
                </div>
                <div className="home-dashboard__feature-item">
                  <div className="home-dashboard__feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span>组件化搭建</span>
                </div>
                <div className="home-dashboard__feature-item">
                  <div className="home-dashboard__feature-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <span>版本管理</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="home-dashboard__stats">
          {statCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card className="home-dashboard__stat-card" bordered={false} hoverable>
                <div
                  className="home-dashboard__stat-icon"
                  style={{ background: card.bg, color: card.color }}
                >
                  {card.icon}
                </div>
                <Statistic
                  title={card.title}
                  value={card.value}
                  valueStyle={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Actions */}
        <Card
          title="快捷操作"
          className="home-dashboard__quick"
          bordered={false}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div
                className="home-dashboard__quick-item"
                onClick={() => navigate("/pages")}
              >
                <FileTextOutlined className="home-dashboard__quick-icon" />
                <div className="home-dashboard__quick-info">
                  <Text strong>页面管理</Text>
                  <Text type="secondary">创建和管理低代码页面</Text>
                </div>
                <ArrowRightOutlined className="home-dashboard__quick-arrow" />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div
                className="home-dashboard__quick-item"
                onClick={() => navigate("/editor/ai-create")}
              >
                <RobotOutlined className="home-dashboard__quick-icon" style={{ color: "#722ed1" }} />
                <div className="home-dashboard__quick-info">
                  <Text strong>AI 页面生成</Text>
                  <Text type="secondary">用自然语言描述，AI 自动生成页面</Text>
                </div>
                <ArrowRightOutlined className="home-dashboard__quick-arrow" />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="home-dashboard__quick-item home-dashboard__quick-item--disabled">
                <AppstoreOutlined className="home-dashboard__quick-icon" />
                <div className="home-dashboard__quick-info">
                  <Text strong>模板管理</Text>
                  <Text type="secondary">页面模板，即将上线</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div className="home-dashboard__quick-item home-dashboard__quick-item--disabled">
                <BlockOutlined className="home-dashboard__quick-icon" />
                <div className="home-dashboard__quick-info">
                  <Text strong>自定义组件</Text>
                  <Text type="secondary">组件库管理，即将上线</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default HomeDashboard;
