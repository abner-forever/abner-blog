/**
 * 编辑器语言包入口
 * 默认跟随系统语言，支持中英文切换
 */
import zhCNMessages from "./zh-CN";
import enMessages from "./en";

export type SupportedLocale = "zh-CN" | "en";

/** 所有可用语言包 */
export const messages: Record<SupportedLocale, Record<string, unknown>> = {
  "zh-CN": zhCNMessages,
  en: enMessages,
};

/** 根据浏览器语言获取最佳匹配的语言代码 */
export function detectLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() || "";
  if (lang.startsWith("zh")) return "zh-CN";
  return "en";
}

/** 通过 localStorage（或自定义存储）覆盖语言 */
const STORAGE_KEY = "editor_locale";

export function getStoredLocale(): SupportedLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "zh-CN" || stored === "en") return stored;
  } catch {
    // localStorage 不可用时忽略
  }
  return null;
}

export function setStoredLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // 忽略
  }
}

/** 获取最终生效的语言 */
export function getEffectiveLocale(): SupportedLocale {
  return getStoredLocale() || detectLocale();
}
