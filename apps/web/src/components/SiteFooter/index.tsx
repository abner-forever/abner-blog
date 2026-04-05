import React from 'react';
import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import { getCurrentLocale } from '@/i18n';
import { getSiteBrand, siteConfig } from '@/config/site';

const { Footer: AntFooter } = Layout;

const SiteFooter: React.FC = () => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const { title, description } = getSiteBrand(locale);
  const year = new Date().getFullYear();

  return (
    <AntFooter className="app-footer">
      <div className="footer-content">
        <span>{t('footer.copyright', { year, title, description })}</span>
        <span className="footer-divider">·</span>
        <a href={siteConfig.icpQueryUrl} target="_blank" rel="noopener noreferrer">
          {siteConfig.icpRecordNumber}
        </a>
        <span className="footer-divider">·</span>
        <span>{t('footer.poweredBy')}</span>
      </div>
    </AntFooter>
  );
};

export default SiteFooter;
