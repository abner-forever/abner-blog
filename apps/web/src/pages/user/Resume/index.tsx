import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Button,
  Space,
} from 'antd';
import {
  GithubOutlined,
  GlobalOutlined,
  MailOutlined,
  BookOutlined,
  FireOutlined,
  EnvironmentOutlined,
  BankOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import { usersControllerGetResume } from '@services/generated/users/users';
import type { UserResumeDto } from '@services/generated/model';
import DataList from '@/components/DataList';
import Loading from '@/components/Loading';
import './index.less';

type ResumeContactRow = {
  icon: React.ReactElement;
  label: string;
  value: string;
  href: string;
};

const { Title, Text } = Typography;

const ResumePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<UserResumeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await usersControllerGetResume(id);

        // 检查是否公开
        if (data.isResumePublic === false) {
          setError('该用户的简历未公开');
          return;
        }

        setResume(data);
      } catch (error) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          setError('用户不存在');
        } else {
          setError('获取简历失败');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error || !resume) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Text style={{ fontSize: 18 }}>{error || '简历加载失败'}</Text>
      </div>
    );
  }

  const displayName = resume.nickname || resume.username;

  const contactRows: ResumeContactRow[] = [
    resume.email
      ? {
          icon: <MailOutlined />,
          label: '邮箱',
          value: resume.email,
          href: `mailto:${resume.email}`,
        }
      : null,
    resume.resumeGithub
      ? {
          icon: <GithubOutlined />,
          label: 'GitHub',
          value: resume.resumeGithub,
          href: resume.resumeGithub,
        }
      : null,
    resume.resumeJuejin
      ? {
          icon: <BookOutlined />,
          label: '掘金',
          value: resume.resumeJuejin,
          href: resume.resumeJuejin,
        }
      : null,
    resume.resumeBlog
      ? {
          icon: <GlobalOutlined />,
          label: '个人博客',
          value: resume.resumeBlog,
          href: resume.resumeBlog,
        }
      : null,
  ].filter((row): row is ResumeContactRow => row !== null);

  return (
    <div className="resume-page">
      {/* Hero Section */}
      <div className="resume-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <Avatar
            size={120}
            src={resume.avatar}
            icon={<UserOutlined />}
            className="hero-avatar"
          />
          <Title level={1} className="hero-name">
            {displayName}
          </Title>
          {resume.resumeTitle && (
            <Text className="hero-title">{resume.resumeTitle}</Text>
          )}

          {(resume.resumeLocation || resume.resumeCompany) && (
            <Space size="middle" className="hero-tags">
              {resume.resumeLocation && (
                <Tag icon={<EnvironmentOutlined />} color="blue">
                  {resume.resumeLocation}
                </Tag>
              )}
              {resume.resumeCompany && (
                <Tag icon={<BankOutlined />} color="purple">
                  {resume.resumeCompany}
                </Tag>
              )}
            </Space>
          )}
        </div>
      </div>

      {/* Content Section */}
      <Row gutter={[24, 24]} className="content-section">
        {/* Left Column */}
        <Col xs={24} lg={14}>
          {/* Skills */}
          {resume.resumeSkills && resume.resumeSkills.length > 0 && (
            <Card title="🛠️ 技术栈" className="content-card">
              <div className="skills-list">
                {resume.resumeSkills.map((skill, index) => (
                  <Tag
                    key={skill}
                    className="skill-tag"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {skill}
                  </Tag>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline */}
          {resume.resumeTimeline && resume.resumeTimeline.length > 0 && (
            <Card title="📅 成长历程" className="content-card">
              <div className="timeline">
                {resume.resumeTimeline.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <Text strong className="timeline-year">
                        {item.year as React.ReactNode}
                      </Text>
                      <Text className="timeline-event">{item.event as React.ReactNode}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Hobbies */}
          {resume.resumeHobbies && resume.resumeHobbies.length > 0 && (
            <Card title="🎮 兴趣爱好" className="content-card">
              <Space wrap>
                {resume.resumeHobbies.map((hobby, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {hobby}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={10}>
          {/* Contact */}
          <Card title="📮 联系方式" className="content-card">
            <DataList
              className="resume-contact-list"
              dataSource={contactRows}
              rowKey={(row) => row.href}
              listRole={false}
              itemRole={false}
              rowClassName="resume-contact-list__row"
              renderItem={(item) => (
                <Space>
                  <span className="contact-icon">{item.icon}</span>
                  <Text>{item.label}:</Text>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.value.replace(/^https?:\/\//, '')}
                  </a>
                </Space>
              )}
            />
          </Card>

          {/* Blog Navigation */}
          <Card title="🚀 快速导航" className="content-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/blogs">
                <Button block icon={<BookOutlined />}>
                  浏览博客文章
                </Button>
              </Link>
              <Link to="/moments">
                <Button block icon={<FireOutlined />}>
                  查看动态
                </Button>
              </Link>
              <Link to="/news">
                <Button block icon={<GlobalOutlined />}>
                  最新热搜资讯
                </Button>
              </Link>
            </Space>
          </Card>

          {/* User Info */}
          <Card title="ℹ️ 用户信息" className="content-card">
            <div style={{ textAlign: 'center' }}>
              <Avatar size={80} src={resume.avatar} icon={<UserOutlined />} />
              <div style={{ marginTop: 12 }}>
                <Link to={`/user/${resume.id}`}>
                  <Button type="link">查看完整主页</Button>
                </Link>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Footer */}
      <div className="resume-footer">
        <Text type="secondary">
          © {new Date().getFullYear()} {displayName} 的个人简历 ·
          <span className="footer-emoji"> 🐉 </span>
          Powered by Abner's Blog
        </Text>
      </div>
    </div>
  );
};

export default ResumePage;
