import { httpMutator } from "./http";
import type { AdminUser } from "@/store/authSlice";

/** SSO 登录状态 */
export interface SSOStatus {
  authenticated: boolean;
  userId?: number;
  username?: string;
  role?: string;
  email?: string;
}

/** 检查 SSO 会话状态（HttpOnly cookie 自动携带） */
export const getSSOStatus = () =>
  httpMutator<SSOStatus>({
    url: "/api/sso/status",
    method: "GET",
  });

/** SSO 登出 */
export const ssoLogout = () =>
  httpMutator<{ success: boolean; message: string; redirectUrl?: string }>({
    url: "/api/sso/logout",
    method: "POST",
  });
