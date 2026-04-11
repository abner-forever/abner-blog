import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeType = 'light' | 'dark' | 'system';
export type SkinType =
  // 经典主题
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'red'
  | 'cyan'
  | 'gold'
  // 酷炫新主题
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
    ? (localStorage.getItem('theme') as ThemeType)
    : 'light';
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    return savedTheme;
  }
  return 'system';
};

const getInitialSkin = (): SkinType => {
  const savedSkin = isBrowser
    ? (localStorage.getItem('skin') as SkinType)
    : 'purple';
  const validSkins: SkinType[] = [
    'purple',
    'blue',
    'green',
    'orange',
    'pink',
    'red',
    'cyan',
    'gold',
    'cyberpunk',
    'aurora',
    'star',
    'chocolate',
    'mint',
    'lavender',
    'claude-code',
    'github-chatgpt',
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

// 主题分类
export const skinCategories = {
  classic: {
    label: '经典主题',
    skins: [
      'purple',
      'blue',
      'green',
      'orange',
      'pink',
      'red',
      'cyan',
      'gold',
    ] as SkinType[],
  },
  special: {
    label: '酷炫主题',
    skins: [
      'cyberpunk',
      'aurora',
      'star',
      'chocolate',
      'mint',
      'lavender',
      'claude-code',
      'github-chatgpt',
    ] as SkinType[],
  },
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setSkin: (state, action: PayloadAction<SkinType>) => {
      state.skin = action.payload;
      localStorage.setItem('skin', action.payload);
    },
  },
});

export const { setTheme, setSkin } = themeSlice.actions;

export default themeSlice.reducer;
