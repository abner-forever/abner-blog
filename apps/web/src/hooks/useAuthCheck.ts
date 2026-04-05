import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { openLoginModal } from '../store/loginModalSlice';
import { useDispatch } from 'react-redux';

/**
 * 检查用户是否已登录，如果未登录则打开登录弹窗
 * @param callback 可选的回调函数，登录成功后执行
 * @returns boolean - 是否已登录
 */
export const useAuthCheck = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const checkAuth = (callback?: () => void | Promise<void>): boolean => {
    if (!isAuthenticated) {
      // 打开登录弹窗，登录成功后执行回调
      dispatch(openLoginModal(callback ? 'auth-success-callback' : undefined));
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    checkAuth,
  };
};

export default useAuthCheck;
