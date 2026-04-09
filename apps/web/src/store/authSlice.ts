import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserProfileDto } from '@services/generated/model';

interface AuthState {
  user: UserProfileDto | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
const isBrowser = typeof window !== 'undefined';
/** 与 http 拦截器、登出接口共用 */
export const AUTH_REFRESH_TOKEN_KEY = 'user-refresh-token';
const storedUser = isBrowser ? localStorage.getItem('user-info') : null;
const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: isBrowser ? localStorage.getItem('user-token') : null,
  isAuthenticated: isBrowser ? !!localStorage.getItem('user-token') : false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: UserProfileDto;
        access_token: string;
        refresh_token: string;
      }>,
    ) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.access_token;
      localStorage.setItem('user-token', action.payload.access_token);
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, action.payload.refresh_token);
      localStorage.setItem('user-info', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      window.localStorage.removeItem('user-token');
      window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      window.localStorage.removeItem('user-info');
    },
    updateUser: (state, action: PayloadAction<UserProfileDto>) => {
      state.user = action.payload;
      window.localStorage.setItem('user-info', JSON.stringify(action.payload));
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } =
  authSlice.actions;
export default authSlice.reducer;
