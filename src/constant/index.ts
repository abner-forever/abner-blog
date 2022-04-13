const host = location.origin

export const HOSTS: Record<string,string> = {
  online: host,
  dev: host
}

export const DEFAULT_HEAD = ''