import { useState, useEffect } from 'react';
import { isMobile, isTablet, addResizeListener } from '../utils/device';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDevice = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      if (isMobile()) {
        setDeviceType('mobile');
      } else if (isTablet()) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // 初始化设备类型
    updateDeviceType();

    // 添加窗口大小变化监听
    const removeListener = addResizeListener(updateDeviceType);

    return () => {
      removeListener();
    };
  }, []);

  return deviceType;
};
