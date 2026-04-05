import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import enUS from 'antd/locale/en_US';
import type { SupportedLocale } from '@/i18n';

/** 应用壳层：antd 与 dayjs 的语言包映射 */
export const antdLocales: Record<SupportedLocale, typeof zhCN> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en: enUS,
};

export const dayjsLocales: Record<SupportedLocale, string> = {
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
  en: 'en',
};

/** 一级 Tab 页面路径（移动端不显示 Navbar） */
export const TAB_PATHS = ['/', '/blogs', '/notes', '/todos', '/profile'] as const;

/** 自带移动端 header 的页面（移动端不显示全局 MobilePageHeader） */
export const CUSTOM_MOBILE_HEADER_PATHS = ['/chat'] as const;
