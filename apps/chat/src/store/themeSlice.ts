import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeType = 'light' | 'dark' | 'system';
export type SkinType =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'red'
  | 'cyan'
  | 'gold'
  | 'cyberpunk'
  | 'aurora'
  | 'star'
  | 'chocolate'
  | 'mint'
  | 'lavender'
  | 'claude-code'
  | 'github-chatgpt';

interface ThemeState {
  theme: ThemeType;
  skin: SkinType;
}

const isBrowser = typeof window !== 'undefined';

const getInitialTheme = (): ThemeType => {
  const savedTheme = isBrowser
    ? (localStorage.getItem('chat-theme') as ThemeType)
    : 'light';
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    return savedTheme;
  }
  return 'system';
};

const getInitialSkin = (): SkinType => {
  const savedSkin = isBrowser
    ? (localStorage.getItem('chat-skin') as SkinType)
    : 'purple';
  const validSkins: SkinType[] = [
    'purple', 'blue', 'green', 'orange', 'pink', 'red', 'cyan', 'gold',
    'cyberpunk', 'aurora', 'star', 'chocolate', 'mint', 'lavender',
    'claude-code', 'github-chatgpt',
  ];
  if (savedSkin && validSkins.includes(savedSkin)) {
    return savedSkin;
  }
  return 'purple';
};

const initialState: ThemeState = {
  theme: getInitialTheme(),
  skin: getInitialSkin(),
};

export const skinCategories = {
  classic: {
    label: '经典主题',
    skins: ['purple', 'blue', 'green', 'orange', 'pink', 'red', 'cyan', 'gold'] as SkinType[],
  },
  special: {
    label: '酷炫主题',
    skins: ['cyberpunk', 'aurora', 'star', 'chocolate', 'mint', 'lavender', 'claude-code', 'github-chatgpt'] as SkinType[],
  },
};

/** 皮肤主色 + 渐变色 + 边框色映射表，供 CSS 变量和 antd ConfigProvider 共享 */
export const SKIN_COLORS: Record<SkinType, { primary: string; secondary: string; borderColor: string }> = {
  purple: { primary: '#667eea', secondary: '#8b5cf6', borderColor: '#c7d2fe' },
  blue: { primary: '#3b82f6', secondary: '#2563eb', borderColor: '#bfdbfe' },
  green: { primary: '#10b981', secondary: '#059669', borderColor: '#a7f3d0' },
  orange: { primary: '#f97316', secondary: '#ea580c', borderColor: '#fed7aa' },
  pink: { primary: '#ec4899', secondary: '#db2777', borderColor: '#fbcfe8' },
  red: { primary: '#ef4444', secondary: '#dc2626', borderColor: '#fecaca' },
  cyan: { primary: '#06b6d4', secondary: '#0891b2', borderColor: '#a5f3fc' },
  gold: { primary: '#f59e0b', secondary: '#d97706', borderColor: '#fde68a' },
  cyberpunk: { primary: '#818cf8', secondary: '#f0abfc', borderColor: '#c4b5fd' },
  aurora: { primary: '#a78bfa', secondary: '#34d399', borderColor: '#ddd6fe' },
  star: { primary: '#3b82f6', secondary: '#8b5cf6', borderColor: '#bfdbfe' },
  chocolate: { primary: '#a16207', secondary: '#7c2d12', borderColor: '#fde68a' },
  mint: { primary: '#34d399', secondary: '#6ee7b7', borderColor: '#a7f3d0' },
  lavender: { primary: '#a78bfa', secondary: '#c4b5fd', borderColor: '#ddd6fe' },
  'claude-code': { primary: '#feca57', secondary: '#ff6b6b', borderColor: '#fef3c7' },
  'github-chatgpt': { primary: '#218bff', secondary: '#0969da', borderColor: '#bfdbfe' },
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload;
      localStorage.setItem('chat-theme', action.payload);
    },
    setSkin: (state, action: PayloadAction<SkinType>) => {
      state.skin = action.payload;
      localStorage.setItem('chat-skin', action.payload);
    },
  },
});

export const { setTheme, setSkin } = themeSlice.actions;
export default themeSlice.reducer;
