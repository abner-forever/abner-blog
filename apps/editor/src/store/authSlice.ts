import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface EditorUser {
  userId: number;
  username: string;
  role: "admin" | "user";
  email?: string;
}

interface AuthState {
  token: string | null;
  user: EditorUser | null;
}

/**
 * 从 localStorage 恢复登录状态（支持 JWT + SSO 两种模式）
 */
const loadInitialState = (): AuthState => {
  // 尝试恢复 JWT token（优先级高）
  const jwtToken = localStorage.getItem("editor-token");
  const userStr = localStorage.getItem("editor-user");
  if (jwtToken && jwtToken !== "sso-session" && userStr) {
    try {
      const user = JSON.parse(userStr) as EditorUser;
      return { token: jwtToken, user };
    } catch {
      // 解析失败，忽略
    }
  }
  // 尝试恢复 SSO 标记（同时恢复用户信息）
  if (localStorage.getItem("sso_authenticated") === "true") {
    const ssoUserStr = localStorage.getItem("sso_user");
    if (ssoUserStr) {
      try {
        const ssoUser = JSON.parse(ssoUserStr) as EditorUser;
        return { token: "sso-session", user: ssoUser };
      } catch {
        // 解析失败，忽略
      }
    }
    return { token: "sso-session", user: null };
  }
  return { token: null, user: null };
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    /** SSO 登录（HttpOnly cookie 模式） */
    setSSOCredentials: (state, action: PayloadAction<EditorUser>) => {
      state.token = "sso-session";
      state.user = action.payload;
      localStorage.setItem("sso_authenticated", "true");
      localStorage.setItem("sso_user", JSON.stringify(action.payload));
    },
    /** JWT 表单登录 */
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: EditorUser }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("editor-token", action.payload.token);
      localStorage.setItem("editor-user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("editor-token");
      localStorage.removeItem("editor-user");
      localStorage.removeItem("sso_authenticated");
      localStorage.removeItem("sso_user");
    },
  },
});

export const { setSSOCredentials, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
