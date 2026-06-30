import React from 'react';
import { useLocation } from 'react-router-dom';

interface KeepAliveProps {
  /** 需要保持挂载的路径前缀 */
  paths: string[];
  children: React.ReactNode;
}

function KeepAlive({ paths, children }: KeepAliveProps) {
  const location = useLocation();
  const isActive = paths.some((p) => location.pathname.startsWith(p));

  return (
    <div
      style={{
        height: '100%',
        opacity: isActive ? 1 : 0,
        overflow: isActive ? undefined : 'hidden',
        pointerEvents: isActive ? undefined : 'none',
        transition: 'opacity 0.2s ease',
      }}
    >
      {children}
    </div>
  );
}

export default KeepAlive;
