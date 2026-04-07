import { ClientInfo, DeviceType, Browser, OS } from './events';

export function generateAnonymousId(): string {
  const stored = localStorage.getItem('_a_id');
  if (stored) return stored;

  const id = `a_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('_a_id', id);
  return id;
}

export function generateSessionId(): string {
  const stored = sessionStorage.getItem('_s_id');
  if (stored) return stored;

  const id = `s_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem('_s_id', id);
  return id;
}

export function getClientInfo(): ClientInfo {
  const ua = navigator.userAgent.toLowerCase();
  const deviceType = getDeviceType(ua);
  const browser = getBrowser(ua);
  const os = getOS(ua);

  return {
    deviceType,
    browser,
    os,
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

function getDeviceType(ua: string): DeviceType {
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  if (ua.includes('mobile') || ua.includes('android mobile')) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(ua: string): Browser {
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

function getOS(ua: string): OS {
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

export function getConnectionType(): string {
  const nav = navigator as NavigatorWithConnection;
  if (nav.connection?.effectiveType) {
    return nav.connection.effectiveType;
  }
  return 'unknown';
}

interface NetworkInformation {
  effectiveType?: string;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getPageUrl(): string {
  return window.location.href;
}

export function getPageTitle(): string {
  return document.title;
}

export function getReferrer(): string {
  return document.referrer;
}

export function isOnline(): boolean {
  return navigator.onLine;
}
