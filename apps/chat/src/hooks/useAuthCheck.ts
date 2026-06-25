import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '@/store';

export const useAuthCheck = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const checkAuth = (callback?: () => void | Promise<void>): boolean => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    if (callback) {
      callback();
    }
    return true;
  };

  return { isAuthenticated, checkAuth };
};

export default useAuthCheck;
