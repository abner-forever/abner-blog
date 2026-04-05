import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import themeReducer from './themeSlice';
import loginModalReducer from './loginModalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    loginModal: loginModalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
