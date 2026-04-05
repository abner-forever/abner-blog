import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

let socketRef: Socket | null = null;

/**
 * 登录后建立 Socket.IO，接收通知与私信推送并刷新相关 React Query 缓存。
 */
export function useSocialRealtime(enabled: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('user-token');
    if (!token) return;

    const socket = io({
      path: '/socket.io',
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
    });
    socketRef = socket;

    const onNotification = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'feed-unread'] });
    };
    const onDm = () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
      void queryClient.invalidateQueries({ queryKey: ['social', 'dm-unread'] });
    };

    socket.on('notification:new', onNotification);
    socket.on('direct_message:new', onDm);

    return () => {
      socket.off('notification:new', onNotification);
      socket.off('direct_message:new', onDm);
      socket.disconnect();
      if (socketRef === socket) socketRef = null;
    };
  }, [enabled, queryClient]);
}
