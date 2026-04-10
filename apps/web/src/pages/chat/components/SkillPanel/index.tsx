import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  List,
  Tag,
  Switch,
  message,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  skillsService,
  type SkillResponse,
  type MarketplaceSkill,
} from '@services/skills';
import './SkillPanel.less';

interface Props {
  onClose: () => void;
  onSelectSkill?: (skillId: string) => void;
}

const SkillPanel: React.FC<Props> = ({ onClose, onSelectSkill }) => {
  const { t } = useTranslation();
  const [installedSkills, setInstalledSkills] = useState<SkillResponse[]>([]);
  const [marketplaceSkills, setMarketplaceSkills] = useState<MarketplaceSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installed, marketplace] = await Promise.all([
        skillsService.getAll(),
        skillsService.getMarketplace(),
      ]);
      setInstalledSkills(installed);
      setMarketplaceSkills(marketplace);
    } catch (err) {
      message.error(t('chat.loadFailed') || '加载技能失败');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInstall = async (marketplaceSkill: MarketplaceSkill) => {
    try {
      await skillsService.install(marketplaceSkill.id);
      message.success(t('chat.installSuccess') || `${marketplaceSkill.name} 安装成功`);
      loadData();
    } catch (err) {
      message.error(t('chat.installFailed') || '安装失败');
    }
  };

  const handleUninstall = async (id: string) => {
    try {
      await skillsService.remove(id);
      message.success(t('chat.uninstallSuccess') || '卸载成功');
      loadData();
    } catch (err) {
      message.error(t('chat.uninstallFailed') || '卸载失败');
    }
  };

  const handleToggleActive = async (skill: SkillResponse) => {
    try {
      if (skill.status === 'active') {
        await skillsService.deactivate(skill.id);
        message.success(t('chat.deactivated') || '技能已停用');
      } else {
        await skillsService.activate(skill.id);
        message.success(t('chat.activated') || '技能已激活');
        if (onSelectSkill) {
          onSelectSkill(skill.id);
        }
      }
      loadData();
    } catch (err) {
      message.error(t('chat.updateFailed') || '更新失败');
    }
  };

  return (
    <div className="skill-panel">
      <div className="panel-header">
        <div className="panel-title">
          <RobotOutlined />
          <span>{t('chat.skills')}</span>
        </div>
        <Button type="text" size="small" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>

      <div className="panel-tabs">
        <div
          className={`tab-item ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          {t('chat.installedSkills')}
          <Tag className="tab-count">{installedSkills.length}</Tag>
        </div>
        <div
          className={`tab-item ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          {t('chat.marketplace')}
        </div>
      </div>

      <div className="panel-content">
        {loading ? (
          <Spin />
        ) : activeTab === 'installed' ? (
          installedSkills.length === 0 ? (
            <Empty description={t('chat.noSkills')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              className="skill-list"
              dataSource={installedSkills}
              renderItem={(skill) => (
                <List.Item
                  className="skill-item"
                  actions={[
                    <Switch
                      key="toggle"
                      size="small"
                      checked={skill.status === 'active'}
                      onChange={() => handleToggleActive(skill)}
                    />,
                    <Popconfirm
                      key="uninstall"
                      title={t('chat.uninstallConfirm')}
                      onConfirm={() => handleUninstall(skill.id)}
                      okText={t('common.ok')}
                      cancelText={t('common.cancel')}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="skill-icon">
                        {skill.avatar ? (
                          <img src={skill.avatar} alt={skill.name} />
                        ) : (
                          <RobotOutlined />
                        )}
                      </div>
                    }
                    title={
                      <div className="skill-title">
                        {skill.name}
                        {skill.status === 'active' && (
                          <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                        )}
                      </div>
                    }
                    description={
                      <div className="skill-info">
                        <span className="skill-desc">{skill.description}</span>
                        <div className="skill-tools">
                          {skill.tools?.slice(0, 3).map((tool) => (
                            <Tag key={tool} className="tool-tag">
                              {tool}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )
        ) : (
          <List
            className="skill-list"
            dataSource={marketplaceSkills}
            renderItem={(skill) => (
              <List.Item
                className="skill-item"
                actions={[
                  skill.isInstalled ? (
                    <Tag key="installed" color="success">
                      {t('chat.installed')}
                    </Tag>
                  ) : (
                    <Button
                      key="install"
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleInstall(skill)}
                    >
                      {t('chat.install')}
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="skill-icon">
                      <RobotOutlined />
                    </div>
                  }
                  title={skill.name}
                  description={
                    <div className="skill-info">
                      <span className="skill-desc">{skill.description}</span>
                      <div className="skill-tools">
                        {skill.tools.slice(0, 3).map((tool) => (
                          <Tag key={tool} className="tool-tag">
                            {tool}
                          </Tag>
                        ))}
                        {skill.tools.length > 3 && (
                          <Tag className="tool-tag">+{skill.tools.length - 3}</Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default SkillPanel;
