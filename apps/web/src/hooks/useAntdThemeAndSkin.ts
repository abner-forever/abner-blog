import { useEffect, useMemo, useState } from 'react';
import { theme as antdTheme } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/**
 * 同步 Redux 主题/皮肤到 document，并生成 antd ConfigProvider 的 theme 配置。
 */
export function useAntdThemeAndSkin() {
  const { theme, skin } = useSelector((state: RootState) => state.theme);
  const [isDark, setIsDark] = useState(false);
  const [skinPrimary, setSkinPrimary] = useState('#8b5cf6');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: string) => {
      const dark = currentTheme === 'dark' || (currentTheme === 'system' && mediaQuery.matches);
      setIsDark(dark);
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    };

    applyTheme(theme);

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-skin', skin as string);
    // 主题变量统一由 theme.less（:root[data-skin=...]）维护，避免 JS 与 CSS 双份配置漂移
    root.style.removeProperty('--skin-primary');
    root.style.removeProperty('--skin-primary-hover');
    root.style.removeProperty('--skin-gradient');
    root.style.removeProperty('--skin-gradient-reverse');
    root.style.removeProperty('--skin-gradient-bg');
    root.style.removeProperty('--skin-glow');
    root.style.removeProperty('--skin-card-bg');
    root.style.removeProperty('--skin-border-color');

    const primaryFromCss = getComputedStyle(root).getPropertyValue('--primary-color').trim();
    if (primaryFromCss) {
      setSkinPrimary(primaryFromCss);
    }
  }, [skin]);

  return useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: skinPrimary,
        borderRadius: 8,
        colorBgContainer: isDark ? '#1e293b' : '#fff',
        colorBgLayout: isDark ? '#0f172a' : '#f8fafc',
        colorBgElevated: isDark ? '#1e293b' : '#fff',
        colorBgSpotlight: isDark ? '#1e293b' : '#f8fafc',
        colorBgContainerDisabled: isDark ? '#1e293b' : '#f5f5f5',
        colorBgBlank: isDark ? '#0f172a' : '#fff',
      },
      components: {
        Card: { borderRadiusLG: 12 },
        Button: { borderRadius: 8, controlHeight: 36 },
        Input: { borderRadius: 8, controlHeight: 36 },
        Layout: {
          bodyBg: isDark ? '#0f172a' : '#f8fafc',
          headerBg: isDark ? '#1e293b' : '#fff',
          footerBg: isDark ? '#1e293b' : '#fff',
          siderBg: isDark ? '#1e293b' : '#fff',
        },
        Menu: { darkItemBg: '#1e293b', darkSubMenuItemBg: '#0f172a' },
        Modal: { contentBg: isDark ? '#1e293b' : '#fff', headerBg: isDark ? '#1e293b' : '#fff' },
        Drawer: { colorBgElevated: isDark ? '#1e293b' : '#fff' },
        Popover: { colorBgElevated: isDark ? '#1e293b' : '#fff' },
        Tooltip: { colorBgSpotlight: isDark ? '#334155' : '#1f2937' },
        Select: { optionSelectedBg: isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.1)' },
        Dropdown: { colorBgElevated: isDark ? '#1e293b' : '#fff' },
        Message: { contentBg: isDark ? '#1e293b' : '#fff' },
        Notification: { colorBgElevated: isDark ? '#1e293b' : '#fff' },
      },
    }),
    [isDark, skinPrimary],
  );
}
