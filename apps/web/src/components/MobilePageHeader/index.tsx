import React from 'react';
import { Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import './index.less';

interface MobilePageHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  onBack,
  rightAction,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="mobile-page-header">
      <div className="mobile-page-header-left">
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={handleBack}
          className="back-btn"
        />
      </div>
      <div className="mobile-page-header-title">
        {title && <span className="title-text">{title}</span>}
      </div>
      <div className="mobile-page-header-right">
        {rightAction || <div className="placeholder" />}
      </div>
    </div>
  );
};

export default MobilePageHeader;
