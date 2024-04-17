import {
  useLocation,
  useNavigate as useDefaultNavigate,
  NavigateOptions,
  To,
} from "react-router-dom";
import { checkHasLogin, clearUserLoginState } from "@/utils/authentication";
import useStore from "./useStore";

interface NavigateParams extends NavigateOptions {
  checkAuth?: boolean;
}

// 页面跳转 hooks
const useNavigate = () => {
  const navigate = useDefaultNavigate();
  const location = useLocation();
  const { global } = useStore();
  const _nativeToPage = (url: To, options?: NavigateParams) => {
    return navigate(url, {
      state: { from: location.pathname },
      ...options,
    });
  };

  return (url: any, options?: NavigateParams) => {
    const { checkAuth } = options || {};
    // 记录路由栈
    if (checkAuth) {
      const _url = global.isLogin ? url : "/login";
      if (!global.isLogin) {
        clearUserLoginState();
      }
      checkHasLogin()
        .then(() => {
          _nativeToPage(_url, options);
        })
        .catch(() => {
          _nativeToPage(_url, options);
        });
    } else {
      _nativeToPage(url, options);
    }
  };
};

export default useNavigate;
