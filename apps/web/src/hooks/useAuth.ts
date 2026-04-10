import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/reduxHooks';
import { useNavigate } from 'react-router-dom';
import {
  AUTH_REFRESH_TOKEN_KEY,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from '../store/authSlice';
import {
  authControllerLogin,
  authControllerLoginByCode,
  authControllerLogout,
  authControllerRegister,
} from '@services/generated/auth/auth';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth,
  );

  const login = useCallback(
    async (
      username: string,
      password: string,
      captcha?: { captchaTicket?: string; captchaRandstr?: string },
    ) => {
      try {
        dispatch(loginStart());
        const data = await authControllerLogin({
          username,
          password,
          captchaTicket: captcha?.captchaTicket,
          captchaRandstr: captcha?.captchaRandstr,
        });
        dispatch(
          loginSuccess({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          }),
        );
        navigate('/');
        return true;
      } catch (err: unknown) {
        const errorMessage =
          (err as { message?: string })?.message || '登录失败';
        dispatch(loginFailure(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [dispatch, navigate],
  );

  const loginByCode = useCallback(
    async (email: string, code: string) => {
      try {
        dispatch(loginStart());
        const data = await authControllerLoginByCode({
          email,
          code,
        });
        dispatch(
          loginSuccess({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          }),
        );
        navigate('/');
        return true;
      } catch (err: unknown) {
        const errorMessage =
          (err as { message?: string })?.message || '登录失败';
        dispatch(loginFailure(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [dispatch, navigate],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        dispatch(loginStart());
        const data = await authControllerRegister({
          username,
          email,
          password,
        });
        dispatch(
          loginSuccess({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          }),
        );
        navigate('/');
      } catch (err: unknown) {
        const errorMessage =
          (err as { message?: string })?.message || '注册失败';
        dispatch(loginFailure(errorMessage));
        throw new Error(errorMessage);
      }
    },
    [dispatch, navigate],
  );

  const logoutUser = useCallback(async () => {
    try {
      const rt =
        typeof window !== 'undefined'
          ? localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
          : null;
      await authControllerLogout({ refresh_token: rt || undefined });
    } catch {
      // 接口失败仍清除本地态，避免用户无法退出
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    loginByCode,
    register,
    logout: logoutUser,
  };
};
