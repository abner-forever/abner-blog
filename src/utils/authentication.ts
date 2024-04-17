import Cookies from "js-cookie";
import stores from "@/store";
/** 获取 token */
export const getToken = () => {
  return Cookies.get("user-token");
};

/** 检查是否登录 */
export const checkHasLogin = () => {
  const token = getToken();
  if (token) {
    return Promise.resolve(token);
  }
  return Promise.reject(new Error("login is needed"));
};

/**
 * 清除登录态
 */
export const clearUserLoginState = () => {
  const currentCookieSetting = {
    expires: -1,
  };
  Object.assign(currentCookieSetting, {});
  Cookies.set("user-token", "", currentCookieSetting);
  Cookies.set("user-id", "", currentCookieSetting);
};
