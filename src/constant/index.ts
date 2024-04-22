import defaultHeader from "@img/defaultHeader.png";
// const isDev = import.meta.env.DEV
const host = location.origin;
// console.log('isDev',isDev);

export const HOSTS: Record<string, string> = {
  online: host,
  dev: location.origin,
};
/** 默认头像 */
export const DEFAULT_HEAD = defaultHeader;
/** 月份 */
export const MONTH_TITLE: Record<number, string> = {
  0: "一月",
  1: "二月",
  2: "三月",
  3: "四月",
  4: "五月",
  5: "六月",
  6: "七月",
  7: "八月",
  8: "九月",
  9: "十月",
  10: "十一月",
  11: "十二月",
};
