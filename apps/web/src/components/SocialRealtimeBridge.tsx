import type { FC } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useSocialRealtime } from '@/hooks/useSocialRealtime';

const SocialRealtimeBridge: FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  useSocialRealtime(!!user);
  return null;
};

export default SocialRealtimeBridge;
