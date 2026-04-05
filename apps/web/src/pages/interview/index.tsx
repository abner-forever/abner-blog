import React, { useState } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Collapse } from 'antd';
import DataList from '@/components/DataList';
import { useTranslation } from 'react-i18next';
import {
  CodeOutlined,
  CloudOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import './index.less';

const { Title, Text, Paragraph } = Typography;

interface InterviewCategory {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  topics: InterviewTopic[];
}

interface InterviewTopic {
  title: string;
  importance: 'high' | 'medium' | 'low';
  points: string[];
}

const interviewCategories: InterviewCategory[] = [
  {
    key: 'react',
    title: 'React 核心',
    icon: <CodeOutlined />,
    color: '#61dafb',
    description: 'React 进阶知识点',
    topics: [
      {
        title: 'React 虚拟 DOM 与 Diff 算法',
        importance: 'high',
        points: [
          'Virtual DOM 的工作原理',
          'Diff 算法的复杂度优化',
          'React 16 架构改进 (Fiber)',
          'Concurrent Mode 解析',
        ],
      },
      {
        title: 'React Hooks 原理',
        importance: 'high',
        points: [
          'useState/useEffect 源码实现',
          'Hook 调用规则及原理',
          '自定义 Hook 的设计模式',
          'useReducer vs Redux',
        ],
      },
      {
        title: 'React 性能优化',
        importance: 'high',
        points: [
          'React.memo / useMemo / useCallback',
          'Code Splitting 与懒加载',
          '虚拟列表实现原理',
          '减少不必要的渲染',
        ],
      },
      {
        title: 'React 状态管理',
        importance: 'high',
        points: [
          'Redux 核心概念与中间件',
          'MobX 响应式原理',
          'Zustand / Jotai 等新型状态管理',
          'React Query / SWR 服务端状态',
        ],
      },
    ],
  },
  {
    key: 'architecture',
    title: '架构设计',
    icon: <CloudOutlined />,
    color: '#722ed1',
    description: '前端架构与工程化',
    topics: [
      {
        title: '微前端架构',
        importance: 'high',
        points: [
          '微前端方案对比 (qiankun/EMP/Module Federation)',
          '应用的拆分解耦策略',
          '共享依赖与样式隔离',
          '路由跳转与状态共享',
        ],
      },
      {
        title: '组件库设计',
        importance: 'medium',
        points: [
          '组件设计原则与模式',
          'Tree Shaking 优化',
          '主题定制与动态换肤',
          '组件文档与 Playground',
        ],
      },
      {
        title: '性能监控与优化',
        importance: 'high',
        points: [
          'Core Web Vitals 优化',
          'Performance API 实战',
          '前端监控体系建设',
          'Webpack/Vite 构建优化',
        ],
      },
    ],
  },
  {
    key: 'fullstack',
    title: '全栈能力',
    icon: <GlobalOutlined />,
    color: '#52c41a',
    description: 'Node.js 与后端技能',
    topics: [
      {
        title: 'Node.js 核心',
        importance: 'medium',
        points: [
          'Event Loop 与异步编程',
          'Stream 流处理',
          'Buffer 与性能优化',
          'Cluster 多进程架构',
        ],
      },
      {
        title: 'NestJS 框架',
        importance: 'medium',
        points: [
          '依赖注入与模块化',
          '装饰器与元编程',
          'GraphQL API 设计',
          '微服务架构',
        ],
      },
      {
        title: '数据库设计',
        importance: 'medium',
        points: [
          'SQL vs NoSQL 选型',
          'ORM 与性能优化',
          '索引与查询优化',
          '事务与分布式事务',
        ],
      },
    ],
  },
  {
    key: 'advanced',
    title: '进阶专题',
    icon: <StarOutlined />,
    color: '#faad14',
    description: '高级技术与底层原理',
    topics: [
      {
        title: '前端工程化',
        importance: 'medium',
        points: [
          'Monorepo 架构设计',
          'CI/CD 流程优化',
          '自动化测试策略',
          '代码质量与规范',
        ],
      },
      {
        title: '安全与性能',
        importance: 'high',
        points: [
          'XSS / CSRF / SQL 注入防护',
          'HTTPS 与 TLS 详解',
          'CDN 缓存策略',
          'SSR/SSG/ISR 方案',
        ],
      },
      {
        title: '网络与协议',
        importance: 'medium',
        points: [
          'HTTP/2 HTTP/3 新特性',
          'WebSocket 实时通信',
          'CDN 与边缘计算',
          'GraphQL vs RESTful',
        ],
      },
    ],
  },
  {
    key: 'questions',
    title: '面试真题',
    icon: <QuestionCircleOutlined />,
    color: '#f5222d',
    description: '大厂高频面试题',
    topics: [
      {
        title: 'React 相关',
        importance: 'high',
        points: [
          'setState 是同步还是异步？',
          'React 17 为什么改事件委托？',
          'React 18 的并发特性是什么？',
          'useEffect 清除函数执行时机？',
        ],
      },
      {
        title: '性能优化',
        importance: 'high',
        points: [
          '首屏优化有哪些方案？',
          '长列表优化思路？',
          '图片加载优化策略？',
          '如何定位内存泄漏？',
        ],
      },
      {
        title: '架构设计',
        importance: 'medium',
        points: [
          '如何设计一个组件库？',
          '前端权限管理系统设计？',
          '如何设计一个 SDK？',
          '低代码平台核心设计？',
        ],
      },
    ],
  },
];

const InterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('react');

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return '#f5222d';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#999';
    }
  };

  const getImportanceText = (importance: string) => {
    return t(`interview.importance.${importance}`);
  };

  const currentCategory = interviewCategories.find(
    (c) => c.key === activeCategory,
  );

  return (
    <div className="interview-page">
      {/* Hero Section */}
      <div className="interview-hero">
        <div className="hero-content">
          <Title level={1} className="hero-title">
            <RocketOutlined /> {t('interview.title')}
          </Title>
          <Paragraph className="hero-desc">
            {t('interview.subtitle')} 🚀
          </Paragraph>
          <Space size="middle">
            <Tag color="blue">React {t('interview.reactCore')}</Tag>
            <Tag color="green">{t('interview.architecture')}</Tag>
            <Tag color="purple">{t('interview.fullstack')}</Tag>
          </Space>
        </div>
      </div>

      <Row gutter={[24, 24]} className="interview-content">
        {/* 左侧分类导航 */}
        <Col xs={24} lg={6}>
          <Card className="category-nav">
            <Title level={4}>📚 {t('interview.knowledgeSystem')}</Title>
            <div className="category-list">
              {interviewCategories.map((category) => (
                <div
                  key={category.key}
                  className={`category-item ${activeCategory === category.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.key)}
                  style={{
                    borderColor:
                      activeCategory === category.key
                        ? category.color
                        : 'transparent',
                  }}
                >
                  <span
                    className="category-icon"
                    style={{ color: category.color }}
                  >
                    {category.icon}
                  </span>
                  <div className="category-info">
                    <Text strong>{t(`interview.${category.key}`)}</Text>
                    <Text type="secondary" className="category-desc">
                      {t(`interview.${category.key}Desc`)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧内容区域 */}
        <Col xs={24} lg={18}>
          <Card className="content-card">
            <div
              className="content-header"
              style={{ borderLeftColor: currentCategory?.color }}
            >
              <Title level={3}>
                {currentCategory?.icon} {t(`interview.${currentCategory?.key}`)}
              </Title>
              <Text type="secondary">
                {t(`interview.${currentCategory?.key}Desc`)}
              </Text>
            </div>

            <Collapse
              ghost
              className="topic-collapse"
              items={currentCategory?.topics.map((topic, index) => ({
                key: String(index),
                label: (
                  <div className="topic-header">
                    <Text strong>{topic.title}</Text>
                    <Tag color={getImportanceColor(topic.importance)}>
                      {getImportanceText(topic.importance)}
                    </Tag>
                  </div>
                ),
                children: (
                  <ul className="topic-points">
                    {topic.points.map((point, i) => (
                      <li key={i}>
                        <CheckCircleOutlined
                          style={{ color: currentCategory?.color }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                ),
              }))}
            />
          </Card>

          {/* 学习资源推荐 */}
          <Card className="resources-card" style={{ marginTop: 24 }}>
            <Title level={4}>📖 {t('interview.resources')}</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <DataList
                  wrapperClassName="interview-resource-column"
                  header={
                    <Text strong className="interview-resource-column__title">
                      📚 {t('interview.books')}
                    </Text>
                  }
                  className="interview-resource-column__list"
                  listTag="ul"
                  itemTag="li"
                  listRole={false}
                  itemRole={false}
                  dataSource={[
                    '《React 进阶之路》',
                    '《深入浅出 Node.js》',
                    '《高性能网站建设指南》',
                    '《代码整洁之道》',
                  ]}
                  rowKey={(item) => item}
                  renderItem={(item) => item}
                />
              </Col>
              <Col xs={24} sm={12}>
                <DataList
                  wrapperClassName="interview-resource-column"
                  header={
                    <Text strong className="interview-resource-column__title">
                      🌐 {t('interview.online')}
                    </Text>
                  }
                  className="interview-resource-column__list"
                  listTag="ul"
                  itemTag="li"
                  listRole={false}
                  itemRole={false}
                  dataSource={[
                    'React 官方文档',
                    'MDN Web Docs',
                    '掘金社区',
                    'GitHub Trending',
                  ]}
                  rowKey={(item) => item}
                  renderItem={(item) => item}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InterviewPage;
