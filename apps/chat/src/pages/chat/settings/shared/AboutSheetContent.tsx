import React from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { MODEL_VENDORS } from '../../constants';

const AboutSheetContent: React.FC = () => {
  const { t } = useTranslation();
  const { state } = useChat();
  const { vendor, model } = state;

  return (
    <div className="sub-sheet-about-info">
      <div className="sub-sheet-about-row">
        <span className="sub-sheet-about-label">{t('chat.currentModel')}</span>
        <span className="sub-sheet-about-value">
          {MODEL_VENDORS.find((v) => v.value === vendor)?.label} / {model}
        </span>
      </div>
      <div className="sub-sheet-about-row">
        <span className="sub-sheet-about-label">{t('chat.systemVersion')}</span>
        <span className="sub-sheet-about-value">v1.0.0</span>
      </div>
      <div className="sub-sheet-about-copyright">
        LongMa AI Chat &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default AboutSheetContent;
