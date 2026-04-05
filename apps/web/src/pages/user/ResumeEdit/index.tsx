import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Divider,
  Breadcrumb,
  Row,
  Col,
  Space,
  Switch,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  usersControllerGetResume,
  usersControllerUpdateResume,
} from '@services/generated/users/users';
import type { RootState } from '../../../store';
import '../UserPages.less';

const { Text } = Typography;
const { TextArea } = Input;

interface ResumeFormValues {
  resumeName: string;
  resumeTitle: string;
  resumeSkills: string;
  resumeLocation: string;
  resumeCompany: string;
  resumeGithub: string;
  resumeJuejin: string;
  resumeBlog: string;
  resumeHobbies: string;
}

const ResumeEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<{ year: string; event: string }[]>(
    [],
  );
  const [isResumePublic, setIsResumePublic] = useState(true);

  // 获取简历数据
  const fetchResume = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await usersControllerGetResume(String(user.id));
      form.setFieldsValue({
        resumeName: res.resumeName || '',
        resumeTitle: res.resumeTitle || '',
        resumeSkills: res.resumeSkills?.join('\n') || '',
        resumeLocation: res.resumeLocation || '',
        resumeCompany: res.resumeCompany || '',
        resumeGithub: res.resumeGithub || '',
        resumeJuejin: res.resumeJuejin || '',
        resumeBlog: res.resumeBlog || '',
        resumeHobbies: res.resumeHobbies?.join('\n') || '',
      });
      setTimeline((res.resumeTimeline || []) as { year: string; event: string }[]);
      setIsResumePublic(res.isResumePublic !== false);
    } catch (error) {
      console.error('获取简历失败', error);
    }
  }, [user?.id, form]);

  useEffect(() => {
    void fetchResume();
  }, [fetchResume]);

  const onFinish = async (values: ResumeFormValues) => {
    if (!user?.id) {
      message.error('请先登录');
      return;
    }

    setLoading(true);
    try {
      // 处理技能和兴趣：按换行分割成数组
      const skills = values.resumeSkills
        ? values.resumeSkills.split('\n').filter((s: string) => s.trim())
        : [];
      const hobbies = values.resumeHobbies
        ? values.resumeHobbies.split('\n').filter((s: string) => s.trim())
        : [];

      const updateData = {
        resumeName: values.resumeName || undefined,
        resumeTitle: values.resumeTitle || undefined,
        resumeSkills: skills.length > 0 ? skills : undefined,
        resumeTimeline: timeline.length > 0 ? timeline : undefined,
        resumeLocation: values.resumeLocation || undefined,
        resumeCompany: values.resumeCompany || undefined,
        resumeGithub: values.resumeGithub || undefined,
        resumeJuejin: values.resumeJuejin || undefined,
        resumeBlog: values.resumeBlog || undefined,
        resumeHobbies: hobbies.length > 0 ? hobbies : undefined,
        isResumePublic: isResumePublic,
      };

      await usersControllerUpdateResume(updateData);
      message.success('简历保存成功！');
      fetchResume();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addTimelineItem = () => {
    setTimeline([...timeline, { year: '', event: '' }]);
  };

  const removeTimelineItem = (index: number) => {
    const newTimeline = [...timeline];
    newTimeline.splice(index, 1);
    setTimeline(newTimeline);
  };

  const updateTimelineItem = (
    index: number,
    field: 'year' | 'event',
    value: string,
  ) => {
    const newTimeline = [...timeline];
    newTimeline[index][field] = value;
    setTimeline(newTimeline);
  };

  if (!user) {
    return (
      <div className="profile-edit-container">
        <Text>请先登录</Text>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-header">
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/')}>{t('nav.home')}</a> },
            {
              title: (
                <a onClick={() => navigate('/profile')}>{t('nav.profile')}</a>
              ),
            },
            { title: '编辑简历' },
          ]}
        />
      </div>

      <Card className="edit-card" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Divider>基本信息</Divider>

          <div
            style={{
              marginBottom: 24,
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            <Space>
              <span>是否公开简历：</span>
              <Switch
                checked={isResumePublic}
                onChange={setIsResumePublic}
                checkedChildren="公开"
                unCheckedChildren="私密"
              />
              <span style={{ color: '#888' }}>
                {isResumePublic
                  ? '他人可以在你的个人主页查看简历'
                  : '你的简历将不会被公开显示'}
              </span>
            </Space>
          </div>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="真实姓名" name="resumeName">
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="职位/头衔" name="resumeTitle">
                <Input placeholder="如：全栈工程师、技术博主" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="所在地" name="resumeLocation">
                <Input placeholder="如：北京、上海" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="公司/学校" name="resumeCompany">
                <Input placeholder="如：某互联网公司、XX大学" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>技能栈</Divider>

          <Form.Item
            label="技能栈（每行一个）"
            name="resumeSkills"
            extra="每行一个技能，如：React、TypeScript、Node.js"
          >
            <TextArea
              rows={4}
              placeholder="React&#10;TypeScript&#10;Node.js&#10;NestJS"
            />
          </Form.Item>

          <Divider>成长历程</Divider>

          <div style={{ marginBottom: 16 }}>
            {timeline.map((item, index) => (
              <Space
                key={index}
                align="baseline"
                style={{ display: 'flex', marginBottom: 8 }}
              >
                <Input
                  placeholder="年份"
                  value={item.year}
                  onChange={(e) =>
                    updateTimelineItem(index, 'year', e.target.value)
                  }
                  style={{ width: 100 }}
                />
                <Input
                  placeholder="经历描述"
                  value={item.event}
                  onChange={(e) =>
                    updateTimelineItem(index, 'event', e.target.value)
                  }
                  style={{ width: 300 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeTimelineItem(index)}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={addTimelineItem}
              icon={<PlusOutlined />}
            >
              添加经历
            </Button>
          </div>

          <Divider>兴趣爱好</Divider>

          <Form.Item
            label="兴趣爱好（每行一个）"
            name="resumeHobbies"
            extra="每行一个爱好"
          >
            <TextArea
              rows={3}
              placeholder=" coding 写代码&#10;learning 学习新技术&#10;sharing 分享知识"
            />
          </Form.Item>

          <Divider>联系方式</Divider>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="GitHub" name="resumeGithub">
                <Input placeholder="https://github.com/xxx" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="掘金" name="resumeJuejin">
                <Input placeholder="https://juejin.cn/user/xxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="个人博客" name="resumeBlog">
            <Input placeholder="https://yourblog.com" />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                保存简历
              </Button>
              <Button
                size="large"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/user/${user?.id}`)}
              >
                预览我的公开简历
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResumeEdit;
