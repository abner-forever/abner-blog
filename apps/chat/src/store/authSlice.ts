import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  bio?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  authMethod: 'jwt' | 'sso' | null;
  loading: boolean;
  error: string | null;
}

const isBrowser = typeof window !== 'undefined';
const storedUser = isBrowser ? localStorage.getItem('user-info') : null;
const storedToken = isBrowser ? localStorage.getItem('user-token') : null;

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  authMethod: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.authMethod = 'jwt';
      state.loading = false;
      state.error = null;
      localStorage.setItem('user-token', action.payload.token);
      localStorage.setItem('user-info', JSON.stringify(action.payload.user));
    },
    setSSOCredentials: (state, action: PayloadAction<UserProfile>) => {
      state.token = 'sso-session';
      state.user = action.payload;
      state.isAuthenticated = true;
      state.authMethod = 'sso';
      state.loading = false;
      state.error = null;
      localStorage.setItem('user-token', 'sso-session');
      localStorage.setItem('user-info', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.authMethod = null;
      localStorage.removeItem('user-token');
      localStorage.removeItem('user-info');
    },
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      localStorage.setItem('user-info', JSON.stringify(action.payload));
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, setSSOCredentials, logout, setUser, setLoading, setError } =
  authSlice.actions;
export default authSlice.reducer;
