import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LoginModalState {
  open: boolean;
  onSuccessCallback: string | null; // 可以存储回调类型
}

const initialState: LoginModalState = {
  open: false,
  onSuccessCallback: null,
};

const loginModalSlice = createSlice({
  name: 'loginModal',
  initialState,
  reducers: {
    openLoginModal: (state, action: PayloadAction<string | undefined>) => {
      state.open = true;
      state.onSuccessCallback = action.payload || null;
    },
    closeLoginModal: (state) => {
      state.open = false;
      state.onSuccessCallback = null;
    },
  },
});

export const { openLoginModal, closeLoginModal } = loginModalSlice.actions;
export default loginModalSlice.reducer;
