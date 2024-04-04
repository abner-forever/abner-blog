import defaultHeader from '@img/defaultHeader.png'
// const host = 'http://foreverheart.top'
const host = location.origin
// const isDev = import.meta.env.DEV

// console.log('isDev',isDev);

export const HOSTS: Record<string,string> = {
  online: host,
  dev: location.origin
}
/** 默认头像 */
export const DEFAULT_HEAD = defaultHeader;
