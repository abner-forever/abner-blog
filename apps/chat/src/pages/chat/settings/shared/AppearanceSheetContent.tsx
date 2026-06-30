import React, { useCallback } from 'react';
import { Select, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAppSelector, useAppDispatch } from '@/store/reduxHooks';
import { setTheme, setSkin, skinCategories, type ThemeType } from '@/store/themeSlice';

const AppearanceSheetContent: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme.theme);
  const skin = useAppSelector((s) => s.theme.skin);

  const handleThemeChange = useCallback(
    (value: ThemeType) => {
      dispatch(setTheme(value));
    },
    [dispatch],
  );

  const handleSkinChange = useCallback(
    (skinName: string) => {
      dispatch(setSkin(skinName as typeof skin));
    },
    [dispatch],
  );

  const handleLanguageChange = useCallback((value: string) => {
    i18n.changeLanguage(value);
  }, []);

  const currentLang =
    i18n.language?.split('-')[0] === 'zh' && i18n.language?.includes('TW')
      ? 'zh-TW'
      : i18n.language?.startsWith('zh')
        ? 'zh-CN'
        : 'en';

  return (
    <div className="sub-sheet-appearance">
      {/* 主题模式 */}
      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">{t('chat.darkMode')}</div>
        <Select
          value={theme}
          onChange={handleThemeChange}
          style={{ width: '100%' }}
          options={[
            { label: t('chat.followSystem', { defaultValue: '跟随系统' }), value: 'system' },
            { label: t('chat.darkMode'), value: 'dark' },
            { label: t('chat.lightMode', { defaultValue: '浅色' }), value: 'light' },
          ]}
        />
      </div>

      {/* 主题皮肤 */}
      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">{t('chat.skin')}</div>
        {Object.entries(skinCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="skin-category">
            <div className="skin-category-label">{t(`chat.skinCategories.${categoryKey}`)}</div>
            <div className="skin-grid">
              {category.skins.map((skinName: string) => (
                <Tooltip key={skinName} title={t(`chat.skins.${skinName}`)} placement="top">
                  <div
                    className={`skin-chip ${skin === skinName ? 'active' : ''}`}
                    onClick={() => handleSkinChange(skinName)}
                  >
                    <div className={`skin-dot skin-${skinName}`} />
                    {skin === skinName && <span className="skin-check">✓</span>}
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sub-sheet-divider" />

      {/* 语言 */}
      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">
          <span className="sub-sheet-field-label-text">
            <GlobalOutlined />
            {t('chat.language')}
          </span>
        </div>
        <Select
          value={currentLang}
          onChange={handleLanguageChange}
          style={{ width: '100%' }}
          options={[
            { label: '中文', value: 'zh-CN' },
            { label: '繁體中文', value: 'zh-TW' },
            { label: 'English', value: 'en' },
          ]}
        />
      </div>
    </div>
  );
};

export default AppearanceSheetContent;
