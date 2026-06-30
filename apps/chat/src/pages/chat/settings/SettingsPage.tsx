import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  BgColorsOutlined,
  DatabaseOutlined,
  BookOutlined,
  ApiOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DraggableSheet from '@/components/DraggableSheet';
import SettingsMenuList, { type SettingsMenuItem } from './SettingsMenuList';
import {
  AccountSheetContent,
  ModelSheetContent,
  AppearanceSheetContent,
  DataSheetContent,
  AboutSheetContent,
  LogoutSheetContent,
} from './shared';
import './SettingsPage.less';

type SheetKey = 'account' | 'model' | 'appearance' | 'data' | 'about' | 'logout';

const SHEET_TITLES: Record<SheetKey, string> = {
  account: 'chat.accountSettings',
  model: 'chat.modelSettings',
  appearance: 'chat.appearanceSettings',
  data: 'chat.dataManagement',
  about: 'chat.aboutSettings',
  logout: 'chat.logoutConfirm',
};

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKey, setSheetKey] = useState<SheetKey | null>(null);

  const openSheet = useCallback((key: SheetKey) => {
    setSheetKey(key);
    setSheetOpen(true);
  }, []);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    // 清除之前的延迟操作，防止快速开关时 key 被误清
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setSheetKey(null), 450); // 比高度塌陷动画（~380ms）略长，确保动画完成
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleItemClick = useCallback(
    (item: SettingsMenuItem) => {
      if (item.sheetKey) {
        openSheet(item.sheetKey as SheetKey);
      } else if (item.route) {
        navigate(item.route);
      }
    },
    [navigate, openSheet],
  );

  const groups = [
    {
      title: t('chat.settingsGroupPreferences', { defaultValue: '偏好设置' }),
      items: [
        { key: 'model', icon: <RobotOutlined />, label: t('chat.modelSettings'), sheetKey: 'model' },
        { key: 'appearance', icon: <BgColorsOutlined />, label: t('chat.appearanceSettings'), sheetKey: 'appearance' },
        { key: 'data', icon: <DatabaseOutlined />, label: t('chat.dataManagement', { defaultValue: '数据管理' }), sheetKey: 'data' },
      ],
    },
    {
      title: t('chat.settingsGroupExtensions', { defaultValue: '扩展功能' }),
      items: [
        { key: 'knowledge-base', icon: <BookOutlined />, label: t('chat.knowledgeBase'), route: '/chat/settings/knowledge-base' },
        { key: 'mcp', icon: <ApiOutlined />, label: t('chat.mcpServers'), route: '/chat/settings/mcp' },
        { key: 'skills', icon: <ToolOutlined />, label: t('chat.skills'), route: '/chat/settings/skills' },
      ],
    },
    {
      title: t('chat.settingsGroupOther', { defaultValue: '其他' }),
      items: [
        { key: 'account', icon: <UserOutlined />, label: t('chat.accountSettings', { defaultValue: '账号管理' }), sheetKey: 'account' },
        { key: 'about', icon: <InfoCircleOutlined />, label: t('chat.aboutSettings'), sheetKey: 'about' },
        { key: 'logout', icon: <LogoutOutlined />, label: t('nav.logout'), isDanger: true, sheetKey: 'logout' },
      ],
    },
  ];

  const renderSheetContent = () => {
    switch (sheetKey) {
      case 'account':
        return <AccountSheetContent onSave={closeSheet} />;
      case 'model':
        return <ModelSheetContent onSave={closeSheet} />;
      case 'appearance':
        return <AppearanceSheetContent />;
      case 'data':
        return <DataSheetContent onActionComplete={closeSheet} />;
      case 'about':
        return <AboutSheetContent />;
      case 'logout':
        return <LogoutSheetContent onCancel={closeSheet} />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="settings-page__header-back"
        />
        <span className="settings-page__header-title">{t('chat.settings')}</span>
      </div>

      <div className="settings-page__content">
        <SettingsMenuList groups={groups} onItemClick={handleItemClick} />
      </div>

      {sheetKey && (
        <DraggableSheet
          open={sheetOpen}
          title={t(SHEET_TITLES[sheetKey], { defaultValue: sheetKey })}
          onClose={closeSheet}
        >
          {renderSheetContent()}
        </DraggableSheet>
      )}
    </div>
  );
};

export default SettingsPage;
