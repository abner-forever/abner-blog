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
  | 'lavender';

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

// 酷炫的皮肤颜色映射 - 14套主题
export const skinColors: Record<
  SkinType,
  {
    name: string;
    emoji: string;
    primary: string;
    primaryHover: string;
    gradient: string;
    gradientReverse: string;
    gradientBg: string;
    glow: string;
    cardBg: string;
    borderColor: string;
    isSpecial?: boolean; // 特殊主题标识
    animation?: string; // 特殊动画
  }
> = {
  // ==================== 经典主题 ====================
  purple: {
    name: '紫气东来',
    emoji: '🟣',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientReverse: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    gradientBg: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
    glow: '0 0 40px rgba(139, 92, 246, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(139, 92, 246, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  blue: {
    name: '天空之蓝',
    emoji: '🔵',
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    gradientReverse: 'linear-gradient(135deg, #66a6ff 0%, #89f7fe 100%)',
    gradientBg: 'linear-gradient(135deg, #0ea5e920 0%, #0284c720 100%)',
    glow: '0 0 40px rgba(14, 165, 233, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%)',
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  green: {
    name: '青山绿水',
    emoji: '🟢',
    primary: '#10b981',
    primaryHover: '#059669',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    gradientReverse: 'linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)',
    gradientBg: 'linear-gradient(135deg, #10b98120 0%, #05966920 100%)',
    glow: '0 0 40px rgba(16, 185, 129, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  orange: {
    name: '橙意满满',
    emoji: '🟠',
    primary: '#f97316',
    primaryHover: '#ea580c',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    gradientReverse: 'linear-gradient(135deg, #fda085 0%, #f6d365 100%)',
    gradientBg: 'linear-gradient(135deg, #f9731620 0%, #ea580c20 100%)',
    glow: '0 0 40px rgba(249, 115, 22, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  pink: {
    name: '粉粉嫩嫩',
    emoji: '🌸',
    primary: '#ec4899',
    primaryHover: '#db2777',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    gradientReverse: 'linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%)',
    gradientBg: 'linear-gradient(135deg, #ec489920 0%, #db277720 100%)',
    glow: '0 0 40px rgba(236, 72, 153, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  red: {
    name: '红红火火',
    emoji: '🔴',
    primary: '#ff2442',
    primaryHover: '#e0203a',
    gradient: 'linear-gradient(135deg, #ff2442 0%, #ff6b81 100%)',
    gradientReverse: 'linear-gradient(135deg, #ff8fa3 0%, #ff2442 100%)',
    gradientBg: 'linear-gradient(135deg, #ff244220 0%, #e0203a20 100%)',
    glow: '0 0 40px rgba(255, 36, 66, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(255, 36, 66, 0.1) 0%, rgba(224, 32, 58, 0.05) 100%)',
    borderColor: 'rgba(255, 36, 66, 0.3)',
  },
  cyan: {
    name: '碧海蓝天',
    emoji: '🩵',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    gradient: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)',
    gradientReverse: 'linear-gradient(135deg, #818cf8 0%, #22d3ee 100%)',
    gradientBg: 'linear-gradient(135deg, #06b6d420 0%, #0891b220 100%)',
    glow: '0 0 40px rgba(6, 182, 212, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  gold: {
    name: '金光闪闪',
    emoji: '🟡',
    primary: '#eab308',
    primaryHover: '#ca8a04',
    gradient: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
    gradientReverse: 'linear-gradient(135deg, #fbbf24 0%, #fde68a 100%)',
    gradientBg: 'linear-gradient(135deg, #eab30820 0%, #ca8a0420 100%)',
    glow: '0 0 40px rgba(234, 179, 8, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(234, 179, 8, 0.1) 0%, rgba(202, 138, 4, 0.05) 100%)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },

  // ==================== 酷炫新主题 ====================

  // 赛博朋克 - 霓虹渐变
  cyberpunk: {
    name: '赛博朋克',
    emoji: '🌃',
    primary: '#00f5ff',
    primaryHover: '#00d4e6',
    gradient: 'linear-gradient(135deg, #00f5ff 0%, #ff00ff 50%, #00f5ff 100%)',
    gradientReverse: 'linear-gradient(135deg, #ff00ff 0%, #00f5ff 100%)',
    gradientBg: 'linear-gradient(135deg, #00f5ff15 0%, #ff00ff15 100%)',
    glow: '0 0 40px rgba(0, 245, 255, 0.5), 0 0 80px rgba(255, 0, 255, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(0, 245, 255, 0.08) 0%, rgba(255, 0, 255, 0.04) 100%)',
    borderColor: 'rgba(0, 245, 255, 0.4)',
    isSpecial: true,
    animation: 'cyberpunk 3s ease infinite',
  },

  // 极光主题 - 动态渐变
  aurora: {
    name: '极光之夜',
    emoji: '🌌',
    primary: '#00ff87',
    primaryHover: '#00e676',
    gradient: 'linear-gradient(135deg, #00ff87 0%, #60efff 50%, #ff00ff 100%)',
    gradientReverse: 'linear-gradient(135deg, #ff00ff 0%, #00ff87 100%)',
    gradientBg:
      'linear-gradient(135deg, #00ff8720 0%, #60efff20 0%, #ff00ff20 100%)',
    glow: '0 0 40px rgba(0, 255, 135, 0.4), 0 0 80px rgba(96, 239, 255, 0.2)',
    cardBg:
      'linear-gradient(145deg, rgba(0, 255, 135, 0.06) 0%, rgba(96, 239, 255, 0.03) 50%, rgba(255, 0, 255, 0.03) 100%)',
    borderColor: 'rgba(0, 255, 135, 0.3)',
    isSpecial: true,
    animation: 'aurora 5s ease infinite',
  },

  // 星辰主题 - 星空效果
  star: {
    name: '星辰大海',
    emoji: '⭐',
    primary: '#ffd700',
    primaryHover: '#ffb700',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    gradientReverse: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
    gradientBg: 'linear-gradient(135deg, #ffd70010 0%, #ffffff10 100%)',
    glow: '0 0 40px rgba(255, 215, 0, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(255, 215, 0, 0.05) 0%, rgba(26, 26, 46, 0.1) 100%)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
    isSpecial: true,
  },

  // 巧克力主题 - 温暖色调
  chocolate: {
    name: '浓郁巧克力',
    emoji: '🍫',
    primary: '#8B4513',
    primaryHover: '#6d3710',
    gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)',
    gradientReverse: 'linear-gradient(135deg, #F4A460 0%, #8B4513 100%)',
    gradientBg: 'linear-gradient(135deg, #8B451320 0%, #D2691E20 100%)',
    glow: '0 0 40px rgba(139, 69, 19, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(139, 69, 19, 0.08) 0%, rgba(210, 105, 30, 0.04) 100%)',
    borderColor: 'rgba(139, 69, 19, 0.3)',
  },

  // 薄荷主题 - 清新感
  mint: {
    name: '清新薄荷',
    emoji: '🌿',
    primary: '#00d9a5',
    primaryHover: '#00b890',
    gradient: 'linear-gradient(135deg, #00d9a5 0%, #7bed9f 50%, #70a1ff 100%)',
    gradientReverse: 'linear-gradient(135deg, #70a1ff 0%, #00d9a5 100%)',
    gradientBg: 'linear-gradient(135deg, #00d9a520 0%, #7bed9f20 100%)',
    glow: '0 0 40px rgba(0, 217, 165, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(0, 217, 165, 0.08) 0%, rgba(123, 237, 159, 0.04) 100%)',
    borderColor: 'rgba(0, 217, 165, 0.3)',
  },

  // 薰衣草主题 - 浪漫紫
  lavender: {
    name: '浪漫薰衣草',
    emoji: '💜',
    primary: '#a855f7',
    primaryHover: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)',
    gradientReverse: 'linear-gradient(135deg, #e879f9 0%, #a855f7 100%)',
    gradientBg: 'linear-gradient(135deg, #a855f720 0%, #c084fc20 100%)',
    glow: '0 0 40px rgba(168, 85, 247, 0.3)',
    cardBg:
      'linear-gradient(145deg, rgba(168, 85, 247, 0.08) 0%, rgba(192, 132, 252, 0.04) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
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
