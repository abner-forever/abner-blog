import { useEffect } from 'react';
import { authControllerGetProfile } from '@services/generated/auth/auth';
import type { AppDispatch } from '@/store';
import { updateUser, logout } from '@/store/authSlice';
import { httpService } from '@/services/http';

interface UseAppBootstrapOptions {
  dispatch: AppDispatch;
  token: string | null;
  navKey: number;
  url: string;
}

/**
 * 页面访问上报、全局 error / rejection 监听、带 token 时拉取用户信息。
 */
export function useAppBootstrap({ dispatch, token, navKey, url }: UseAppBootstrapOptions) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        httpService
          .post('/api/track/page-view', { path: window.location.pathname })
          .catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [navKey, url]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await authControllerGetProfile();
          dispatch(updateUser(data));
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          dispatch(logout());
        }
      }
    };
    void initAuth();
  }, [token, dispatch]);
}
