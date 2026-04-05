import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AdminUser {
  userId: number;
  username: string;
  nickname?: string;
  role: "admin" | "user";
  email?: string;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
}

const initialState: AuthState = {
  token: localStorage.getItem("admin-token"),
  user: null,
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
      localStorage.setItem("admin-token", action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("admin-token");
    },
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
