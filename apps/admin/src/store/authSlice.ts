import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AdminUser {
  userId: number;
  username: string;
  nickname?: string;
  role: "admin" | "user";
  email?: string;
}

export type AuthMethod = "jwt" | "sso" | null;

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  authMethod: AuthMethod;
}

const initialState: AuthState = {
  token: localStorage.getItem("admin-token"),
  user: null,
  authMethod: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AdminUser }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.authMethod = "jwt";
      localStorage.setItem("admin-token", action.payload.token);
    },
    /** 设置 SSO 登录凭据（无 JWT token，仅 HttpOnly cookie） */
    setSSOCredentials: (state, action: PayloadAction<AdminUser>) => {
      state.token = "sso-session"; // 非真实 JWT，仅标记已登录
      state.user = action.payload;
      state.authMethod = "sso";
      // SSO 不写 localStorage token（cookie 由服务端管理）
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.authMethod = null;
      localStorage.removeItem("admin-token");
    },
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, setSSOCredentials, logout, setUser } =
  authSlice.actions;
export default authSlice.reducer;
