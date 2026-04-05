import React from 'react';
import { Avatar, Button, Space, Divider, Typography, Tooltip, Tag } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  EnvironmentOutlined,
  SolutionOutlined,
  CalendarOutlined,
  SettingOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { UserProfileDto } from '@services/generated/model';
import './index.less';

const { Title, Text } = Typography;

interface ProfileInfoProps {
  user?: UserProfileDto;
  isCurrentUser?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  user: propUser,
  isCurrentUser: propIsCurrentUser,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const user = propUser || currentUser;
  const isCurrentUser =
    propIsCurrentUser !== undefined
      ? propIsCurrentUser
      : currentUser?.id === user?.id;

  if (!user) return null;

  // 优先显示昵称，没有则显示用户名
  const displayName = user.nickname || user.username;

  return (
    <div className="profile-header-card">
      <div className="profile-header-main">
        <div className="profile-avatar-wrapper">
          <Avatar
            src={user.avatar}
            icon={<UserOutlined />}
            size={90}
            className="profile-avatar"
          />
        </div>

        <div className="profile-info-content">
          <div className="profile-name-row">
            <Title level={2} className="profile-username">
              {displayName}
            </Title>
            {isCurrentUser && (
              <Tag color="blue" className="level-tag">
                Lv.1
              </Tag>
            )}
          </div>

          <div className="profile-bio-row">
            <SolutionOutlined className="row-icon" />
            <Text className="profile-bio">
              {user.bio || '还没有填写个人简介~'}
            </Text>
          </div>

          <div className="profile-meta-row">
            <Space split={<Divider type="vertical" className="meta-divider" />}>
              <span className="meta-item">
                <EnvironmentOutlined /> IP属地：上海
              </span>
              <span className="meta-item">
                <CalendarOutlined /> 加入于{' '}
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </Space>
          </div>
        </div>

        <div className="profile-actions">
          {isCurrentUser ? (
            <Space>
              <Button
                type="primary"
                ghost
                icon={<EyeOutlined />}
                onClick={() => navigate(`/resume/${user.id}`)}
                className="edit-btn"
              >
                查看简历
              </Button>
              <Button
                type="primary"
                ghost
                icon={<FileTextOutlined />}
                onClick={() => navigate('/profile/resume')}
                className="edit-btn"
              >
                编辑简历
              </Button>
              <Button
                type="primary"
                ghost
                icon={<EditOutlined />}
                onClick={() => navigate('/profile/edit')}
                className="edit-btn"
              >
                编辑资料
              </Button>
              <Tooltip title="个人设置">
                <Button icon={<SettingOutlined />} className="settings-btn" />
              </Tooltip>
            </Space>
          ) : (
            <Button type="primary" className="follow-btn">
              关注
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
