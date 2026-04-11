import { useAppDispatch, useAppSelector } from '@/store/reduxHooks';
import { Drawer, message } from 'antd';
import {
  setSkin,
  setTheme,
  skinCategories,
  type SkinType,
} from '@/store/themeSlice';
import './index.less';

interface SkinPickerProps {
  visible: boolean;
  onClose: () => void;
}

// 自动切换到暗黑模式的主题
const autoDarkThemes: SkinType[] = ['cyberpunk', 'aurora', 'star'];

const skinOptions: { value: SkinType; label: string; emoji: string }[] = [
  // 经典主题
  { value: 'purple', label: '紫气东来', emoji: '🟣' },
  { value: 'blue', label: '天空之蓝', emoji: '🔵' },
  { value: 'green', label: '青山绿水', emoji: '🟢' },
  { value: 'orange', label: '橙意满满', emoji: '🟠' },
  { value: 'pink', label: '粉粉嫩嫩', emoji: '🌸' },
  { value: 'red', label: '红红火火', emoji: '🔴' },
  { value: 'cyan', label: '碧海蓝天', emoji: '🩵' },
  { value: 'gold', label: '金光闪闪', emoji: '🟡' },
  // 酷炫主题
  { value: 'cyberpunk', label: '赛博朋克', emoji: '🌃' },
  { value: 'aurora', label: '极光之夜', emoji: '🌌' },
  { value: 'star', label: '星辰大海', emoji: '⭐' },
  { value: 'chocolate', label: '浓郁巧克力', emoji: '🍫' },
  { value: 'mint', label: '清新薄荷', emoji: '🌿' },
  { value: 'lavender', label: '浪漫薰衣草', emoji: '💜' },
  { value: 'claude-code', label: 'Claude Code', emoji: '🧡' },
  { value: 'github-chatgpt', label: 'GitHub ChatGPT', emoji: '🐙' },
];

const skinPreviewStyles: Record<
  SkinType,
  { gradient: string; glow: string; animation?: string }
> = {
  purple: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glow: '0 0 40px rgba(139, 92, 246, 0.3)' },
  blue: { gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', glow: '0 0 40px rgba(14, 165, 233, 0.3)' },
  green: { gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', glow: '0 0 40px rgba(16, 185, 129, 0.3)' },
  orange: { gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', glow: '0 0 40px rgba(249, 115, 22, 0.3)' },
  pink: { gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', glow: '0 0 40px rgba(236, 72, 153, 0.3)' },
  red: { gradient: 'linear-gradient(135deg, #ff2442 0%, #ff5225 100%)', glow: '0 0 36px rgba(255, 36, 66, 0.32)' },
  cyan: { gradient: 'linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)', glow: '0 0 40px rgba(6, 182, 212, 0.3)' },
  gold: { gradient: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)', glow: '0 0 40px rgba(234, 179, 8, 0.3)' },
  cyberpunk: { gradient: 'linear-gradient(135deg, #00f5ff 0%, #ff00ff 50%, #00f5ff 100%)', glow: '0 0 40px rgba(0, 245, 255, 0.5), 0 0 80px rgba(255, 0, 255, 0.3)', animation: 'cyberpunk 3s ease infinite' },
  aurora: { gradient: 'linear-gradient(135deg, #00ff87 0%, #60efff 50%, #ff00ff 100%)', glow: '0 0 40px rgba(0, 255, 135, 0.4), 0 0 80px rgba(96, 239, 255, 0.2)', animation: 'aurora 5s ease infinite' },
  star: { gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', glow: '0 0 40px rgba(255, 215, 0, 0.3)' },
  chocolate: { gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)', glow: '0 0 40px rgba(139, 69, 19, 0.3)' },
  mint: { gradient: 'linear-gradient(135deg, #00d9a5 0%, #7bed9f 50%, #70a1ff 100%)', glow: '0 0 40px rgba(0, 217, 165, 0.3)' },
  lavender: { gradient: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)', glow: '0 0 40px rgba(168, 85, 247, 0.3)' },
  'claude-code': { gradient: 'linear-gradient(135deg, #d97757 0%, #c96442 100%)', glow: '0 0 28px rgba(217, 119, 87, 0.22)' },
  'github-chatgpt': { gradient: 'linear-gradient(135deg, #218bff 0%, #0969da 100%)', glow: '0 0 24px rgba(9, 105, 218, 0.24)' },
};

const SkinPicker: React.FC<SkinPickerProps> = ({ visible, onClose }) => {
  const dispatch = useAppDispatch();
  const currentSkin = useAppSelector((state) => state.theme.skin);

  // 移动端使用底部抽屉
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const placement = isMobile ? 'bottom' : 'right';

  const handleSkinChange = (skin: SkinType) => {
    dispatch(setSkin(skin));
    const skinOption = skinOptions.find((s) => s.value === skin)!;

    // 酷炫主题自动切换到暗黑模式
    if (autoDarkThemes.includes(skin)) {
      dispatch(setTheme('dark'));
      message.success(
        <span>
          已切换到{' '}
          <span style={{ fontWeight: 'bold' }}>
            {skinOption.emoji} {skinOption.label}
          </span>{' '}
          主题 + 🌙 暗黑模式 ✨
        </span>,
      );
    } else {
      message.success(
        <span>
          已切换到{' '}
          <span style={{ fontWeight: 'bold' }}>
            {skinOption.emoji} {skinOption.label}
          </span>{' '}
          主题 ✨
        </span>,
      );
    }
    onClose();
  };

  const renderSkinCard = (skin: SkinType) => {
    const skinOption = skinOptions.find((s) => s.value === skin)!;
    const preview = skinPreviewStyles[skin];
    const isActive = currentSkin === skin;
    const isSpecial = skinCategories.special.skins.includes(skin);

    return (
      <div
        key={skin}
        className={`skin-card ${isActive ? 'active' : ''} ${isSpecial ? 'special' : ''}`}
        onClick={() => handleSkinChange(skin)}
        style={{
          background: preview.gradient,
          boxShadow: isActive ? preview.glow : 'none',
          animation: preview.animation || 'none',
        }}
      >
        <div className="skin-card-inner">
          <span className="skin-emoji">{skinOption.emoji}</span>
          <span className="skin-name">{skinOption.label}</span>
          {isActive && <span className="skin-check">✓</span>}
        </div>
        <div className="skin-shine" />
        {isSpecial && <div className="special-glow" />}
      </div>
    );
  };

  return (
    <Drawer
      title={<span className="skin-modal-title">🎨 选择主题皮肤</span>}
      open={visible}
      onClose={onClose}
      footer={null}
      placement={placement}
      size={isMobile ? '70vh' : 720}
      className="skin-picker-modal"
    >
      {/* 经典主题 */}
      <div className="skin-section">
        <div className="skin-section-title">
          <span>✨ {skinCategories.classic.label}</span>
        </div>
        <div className="skin-grid">
          {skinCategories.classic.skins.map(renderSkinCard)}
        </div>
      </div>

      {/* 酷炫主题 */}
      <div className="skin-section">
        <div className="skin-section-title">
          <span>🚀 {skinCategories.special.label}</span>
          <span className="new-badge">NEW</span>
        </div>
        <div className="skin-grid">
          {skinCategories.special.skins.map(renderSkinCard)}
        </div>
      </div>

      <div className="skin-tips">
        <span>💡 提示：点击卡片即可切换主题，酷炫主题带有动态特效</span>
      </div>
    </Drawer>
  );
};

export default SkinPicker;
