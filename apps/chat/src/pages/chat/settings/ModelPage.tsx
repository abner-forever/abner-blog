import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ModelSheetContent from './shared/ModelSheetContent';

const ModelPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="settings-fullscreen-page">
      <div className="settings-page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="settings-page-back"
        />
        <span className="settings-page-title">{t('chat.modelSettings')}</span>
      </div>
      <div className="settings-page-content settings-page-content--sheet">
        <ModelSheetContent onSave={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default ModelPage;
