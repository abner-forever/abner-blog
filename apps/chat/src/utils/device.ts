export const isMobile = () => {
  // 检查用户代理
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'iphone',
    'ipod',
    'windows phone',
    'mobile',
    'phone',
  ];

  // 检查屏幕宽度
  const isMobileScreen = window.innerWidth < 576;

  // 检查用户代理是否包含移动设备关键词
  const isMobileUserAgent = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword),
  );

  return isMobileScreen || isMobileUserAgent;
};

export const isTablet = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const tabletKeywords = ['ipad', 'tablet'];
  const isTabletScreen = window.innerWidth >= 576 && window.innerWidth < 992;
  const isTabletUserAgent = tabletKeywords.some((keyword) =>
    userAgent.includes(keyword),
  );

  return isTabletScreen || isTabletUserAgent;
};

export const isDesktop = () => {
  return window.innerWidth >= 992;
};

// 监听窗口大小变化
export const addResizeListener = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};
