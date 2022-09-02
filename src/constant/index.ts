import defaultHeader from '@img/defaultHeader.png'
const host = location.origin

export const HOSTS: Record<string,string> = {
  online: host,
  dev: host
}
/** 默认头像 */
export const DEFAULT_HEAD = defaultHeader;