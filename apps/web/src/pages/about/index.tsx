import React from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Button,
  Space,
  Statistic,
} from 'antd';
import {
  GithubOutlined,
  GlobalOutlined,
  BookOutlined,
  ToolOutlined,
  RocketOutlined,
  StarOutlined,
  CodeOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SafetyOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataList from '@/components/DataList';
import './index.less';

const { Title, Text, Paragraph } = Typography;

// 项目信息
const project = {
  name: 'ABNER Blog',
  version: 'v2.0.0',
  description:
    '基于 pnpm monorepo 架构的全栈博客系统，采用 React + NestJS + TypeORM 技术栈构建',
  author: 'Abner',
  github: 'https://github.com/abner-forever/abner-blog',
  techStack: [
    'React 18',
    'TypeScript',
    'Vite 6',
    'NestJS 11',
    'TypeORM',
    'MySQL',
    'Redis',
    'Ant Design 6',
    'Redux Toolkit',
    'TanStack Query',
    'JWT',
    'Docker',
  ],
  stats: {
    blogs: 42,
    users: 1256,
    visits: '52.3k',
    commits: 328,
  },
  features: [
    { icon: <CodeOutlined />, text: '前后端分离架构', color: '#667eea' },
    { icon: <ApiOutlined />, text: 'RESTful API 设计', color: '#f5576c' },
    {
      icon: <DatabaseOutlined />,
      text: 'TypeORM 数据持久化',
      color: '#4facfe',
    },
    { icon: <CloudOutlined />, text: 'Redis 缓存加速', color: '#43e97b' },
    { icon: <SafetyOutlined />, text: 'JWT 身份认证', color: '#fa709a' },
    {
      icon: <SyncOutlined />,
      text: 'TanhStack Query 状态管理',
      color: '#fee140',
    },
  ],
  timeline: [
    { year: '2026.04', event: '完成 AI 聊天助手集成，支持智能对话' },
    { year: '2026.01', event: '重构为 monorepo 架构，统一代码管理' },
    { year: '2025.10', event: '新增热搜资讯模块，实时聚合热点' },
    { year: '2025.06', event: '上线笔记收藏夹功能，支持多分类管理' },
    { year: '2025.03', event: '重构 AI 服务，支持日程和待办管理' },
    { year: '2024.12', event: '实现评论点赞和动态功能' },
  ],
  modules: [
    { name: '用户端', path: '/', desc: '面向读者的博客前台' },
    { name: '管理后台', path: '/admin', desc: '内容管理与数据分析' },
    { name: '后端 API', path: '/api', desc: 'NestJS RESTful 服务' },
  ],
};

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <Avatar
            size={120}
            src="https://api.dicebear.com/7.x/shapes/svg?seed=blog&backgroundColor=ffdfbf"
            className="hero-avatar"
          />
          <Title level={1} className="hero-name">
            {project.name}
          </Title>
          <Text className="hero-nickname">
            {project.version} · 全栈博客系统
          </Text>
          <Paragraph className="hero-bio">{project.description}</Paragraph>

          <Space size="middle" className="hero-tags">
            <Tag icon={<GlobalOutlined />} color="blue">
              Monorepo
            </Tag>
            <Tag icon={<CodeOutlined />} color="purple">
              TypeScript
            </Tag>
            <Tag icon={<RocketOutlined />} color="orange">
              全栈
            </Tag>
          </Space>

          <Space size="middle" className="hero-actions">
            <Button
              type="primary"
              size="large"
              icon={<GithubOutlined />}
              href={project.github}
              target="_blank"
            >
              GitHub
            </Button>
            <Link to="/">
              <Button size="large" icon={<BookOutlined />}>
                访问博客
              </Button>
            </Link>
          </Space>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <Row gutter={[24, 24]} justify="center">
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic
                title="博客文章"
                value={project.stats.blogs}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic
                title="注册用户"
                value={project.stats.users}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic
                title="总访问量"
                value={project.stats.visits}
                prefix={<GlobalOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic
                title="代码提交"
                value={project.stats.commits}
                prefix={<RocketOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Content Section */}
      <Row gutter={[24, 24]} className="content-section">
        {/* Left Column */}
        <Col xs={24} lg={14}>
          {/* Features */}
          <Card title="✨ 核心特性" className="content-card">
            <Row gutter={[16, 16]}>
              {project.features.map((feature, index) => (
                <Col xs={12} sm={8} key={index}>
                  <div
                    className="feature-item"
                    style={{ borderColor: feature.color }}
                  >
                    <span
                      className="feature-icon"
                      style={{ color: feature.color }}
                    >
                      {feature.icon}
                    </span>
                    <Text className="feature-text">{feature.text}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Tech Stack */}
          <Card title="🛠️ 技术栈" className="content-card">
            <div className="skills-list">
              {project.techStack.map((skill, index) => (
                <Tag
                  key={skill}
                  className="skill-tag"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    background: 'var(--skin-gradient-bg)',
                    borderColor: 'var(--skin-border-color)',
                    color: 'var(--text-main)',
                  }}
                >
                  {skill}
                </Tag>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card title="📅 更新历程" className="content-card">
            <div className="timeline">
              {project.timeline.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <Text strong className="timeline-year">
                      {item.year}
                    </Text>
                    <Text className="timeline-event">{item.event}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={10}>
          {/* Architecture */}
          <Card title="🏗️ 项目架构" className="content-card">
            <DataList
              className="about-modules-list"
              dataSource={project.modules}
              rowKey={(m) => m.path}
              rowClassName="about-modules-list__row"
              renderItem={(item) => (
                <Space>
                  <span className="contact-icon">
                    <CloudOutlined />
                  </span>
                  <Link to={item.path}>
                    <Text strong>{item.name}</Text>
                  </Link>
                  <Text type="secondary">- {item.desc}</Text>
                </Space>
              )}
            />
          </Card>

          {/* Links */}
          <Card title="🔗 相关链接" className="content-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<GithubOutlined />}
                href={project.github}
                target="_blank"
                className="link-btn"
              >
                GitHub 仓库
              </Button>
              <Button
                block
                icon={<BookOutlined />}
                href="https://github.com/abner-forever/abner-blog"
                target="_blank"
                className="link-btn"
              >
                项目文档
              </Button>
              <Link to="/">
                <Button block icon={<GlobalOutlined />} className="link-btn">
                  博客前台
                </Button>
              </Link>
              <Link to="/admin">
                <Button block icon={<ToolOutlined />} className="link-btn">
                  管理后台
                </Button>
              </Link>
            </Space>
          </Card>

          {/* Quick Navigation */}
          <Card title="🚀 快速导航" className="content-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/blogs">
                <Button block icon={<BookOutlined />}>
                  {t('home.browseArticles')}
                </Button>
              </Link>
              <Link to="/moments">
                <Button block icon={<RocketOutlined />}>
                  查看{t('nav.moments')}动态
                </Button>
              </Link>
              <Link to="/news">
                <Button block icon={<GlobalOutlined />}>
                  最新热搜资讯
                </Button>
              </Link>
              <Link to="/tools">
                <Button block icon={<ToolOutlined />}>
                  {t('home.toolsTitle')}
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      <div className="about-footer">
        <Text type="secondary">
          © {new Date().getFullYear()} {project.name} ·
          <span className="footer-emoji"> 🚀 </span>
          Built with ❤️ using React + NestJS + TypeORM
        </Text>
      </div>
    </div>
  );
};

export default AboutPage;
