import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/reduxHooks';
import { useNavigate } from 'react-router-dom';
import { setCredentials, logout } from '@/store/authSlice';
import { httpMutator } from '@/services/http';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    nickname?: string;
    email?: string;
    avatar?: string;
  };
}

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth,
  );

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const data = await httpMutator<LoginResponse>({
          url: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { username, password },
        });
        dispatch(
          setCredentials({
            token: data.access_token,
            user: {
              id: data.user.id,
              username: data.user.username,
              nickname: data.user.nickname,
              email: data.user.email,
              avatar: data.user.avatar,
            },
          }),
        );
        navigate('/chat');
        return true;
      } catch (err: unknown) {
        const errorMessage =
          (err as { message?: string })?.message || '登录失败';
        throw new Error(errorMessage);
      }
    },
    [dispatch, navigate],
  );

  const logoutUser = useCallback(async () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout: logoutUser,
  };
};
