import { httpMutator } from "./http";
import type { EditorUser } from "@/store/authSlice";

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

/** 解析 SSOStatus 为 EditorUser（带角色校验） */
export const parseSSOUser = (
  status: SSOStatus,
): EditorUser | null => {
  if (
    status.authenticated &&
    status.userId &&
    status.username &&
    status.role
  ) {
    return {
      userId: status.userId,
      username: status.username,
      role: status.role as "admin" | "user",
      email: status.email,
    };
  }
  return null;
};
