import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { openLoginModal, closeLoginModal } from '../store/loginModalSlice';

// 打开登录弹窗
export const useLoginModal = () => {
  const dispatch = useDispatch();
  const loginModalState = useSelector((state: RootState) => state.loginModal);

  const open = (onSuccessCallback?: string) => {
    dispatch(openLoginModal(onSuccessCallback));
  };

  const close = () => {
    dispatch(closeLoginModal());
  };

  return {
    open,
    close,
    isOpen: loginModalState.open,
  };
};

export default useLoginModal;
