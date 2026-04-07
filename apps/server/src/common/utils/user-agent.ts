export interface UserAgentInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'other';
  os: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'other';
}

export function parseUserAgent(userAgent: string): UserAgentInfo {
  const ua = userAgent.toLowerCase();

  const deviceType = getDeviceType(ua);
  const browser = getBrowser(ua);
  const os = getOS(ua);

  return { deviceType, browser, os };
}

function getDeviceType(ua: string): UserAgentInfo['deviceType'] {
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  if (ua.includes('mobile') || ua.includes('android mobile')) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(ua: string): UserAgentInfo['browser'] {
  if (ua.includes('edg/') || ua.includes('edge/')) {
    return 'edge';
  }
  if (ua.includes('chrome/') && !ua.includes('chromium')) {
    return 'chrome';
  }
  if (ua.includes('firefox/')) {
    return 'firefox';
  }
  if (ua.includes('safari/') && !ua.includes('chrome')) {
    return 'safari';
  }
  if (ua.includes('msie') || ua.includes('trident/')) {
    return 'ie';
  }
  return 'other';
}

function getOS(ua: string): UserAgentInfo['os'] {
  if (ua.includes('windows nt')) {
    return 'windows';
  }
  if (ua.includes('mac os x') || ua.includes('macos')) {
    return 'macos';
  }
  if (ua.includes('linux') && !ua.includes('android')) {
    return 'linux';
  }
  if (ua.includes('android')) {
    return 'android';
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }
  return 'other';
}
