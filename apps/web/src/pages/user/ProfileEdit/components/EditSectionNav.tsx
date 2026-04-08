import React from 'react';
import { SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { EditSection } from '../types';

interface EditSectionNavProps {
  activeSection: EditSection;
  onSectionChange: (section: EditSection) => void;
}

const EditSectionNav: React.FC<EditSectionNavProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="edit-nav">
      <button
        type="button"
        className={`edit-nav__item ${activeSection === 'basic' ? 'is-active' : ''}`}
        onClick={() => onSectionChange('basic')}
      >
        <UserOutlined />
        <span>{t('profile.basicTitle')}</span>
      </button>
      <button
        type="button"
        className={`edit-nav__item ${activeSection === 'security' ? 'is-active' : ''}`}
        onClick={() => onSectionChange('security')}
      >
        <SafetyCertificateOutlined />
        <span>{t('profile.securityTitle')}</span>
      </button>
    </div>
  );
};

export default EditSectionNav;
