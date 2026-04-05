import type { SupportedLocale } from '@/i18n';

/** 各语言下的站点展示名与副标题（页脚、导航、认证页等共用） */
export const siteBrandByLocale: Record<
  SupportedLocale,
  { title: string; description: string }
> = {
  'zh-CN': {
    title: 'ABNER的博客',
    description: '记录生活与技术',
  },
  'zh-TW': {
    title: 'ABNER的博客',
    description: '記錄生活與技術',
  },
  en: {
    title: "ABNER's Blog",
    description: 'Life & tech',
  },
};

/** 备案与外链等不因语言切换而变的业务常量 */
export const siteConfig = {
  icpRecordNumber: '豫ICP备xxxxxxx号',
  icpQueryUrl: 'https://beian.miit.gov.cn/',
} as const;

export function getSiteBrand(locale: SupportedLocale) {
  return siteBrandByLocale[locale];
}
