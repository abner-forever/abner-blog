import defaultHeader from '@img/defaultHeader.png'
// const host = 'https://foreverheart.top'
// const isDev = import.meta.env.DEV
const host = location.origin
// console.log('isDev',isDev);

export const HOSTS: Record<string,string> = {
  online: host,
  dev: location.origin
}
/** 默认头像 */
export const DEFAULT_HEAD = defaultHeader;
