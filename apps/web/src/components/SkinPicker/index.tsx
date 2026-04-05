import { useAppDispatch, useAppSelector } from '@/store/reduxHooks';
import { Drawer, message } from 'antd';
import {
  setSkin,
  setTheme,
  skinColors,
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
];

const SkinPicker: React.FC<SkinPickerProps> = ({ visible, onClose }) => {
  const dispatch = useAppDispatch();
  const currentSkin = useAppSelector((state) => state.theme.skin);

  // 移动端使用底部抽屉
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const placement = isMobile ? 'bottom' : 'right';

  const handleSkinChange = (skin: SkinType) => {
    dispatch(setSkin(skin));
    const colors = skinColors[skin];

    // 酷炫主题自动切换到暗黑模式
    if (autoDarkThemes.includes(skin)) {
      dispatch(setTheme('dark'));
      message.success(
        <span>
          已切换到{' '}
          <span style={{ fontWeight: 'bold' }}>
            {colors.emoji} {colors.name}
          </span>{' '}
          主题 + 🌙 暗黑模式 ✨
        </span>,
      );
    } else {
      message.success(
        <span>
          已切换到{' '}
          <span style={{ fontWeight: 'bold' }}>
            {colors.emoji} {colors.name}
          </span>{' '}
          主题 ✨
        </span>,
      );
    }
    onClose();
  };

  const renderSkinCard = (skin: SkinType) => {
    const skinOption = skinOptions.find((s) => s.value === skin)!;
    const colors = skinColors[skin];
    const isActive = currentSkin === skin;

    return (
      <div
        key={skin}
        className={`skin-card ${isActive ? 'active' : ''} ${colors.isSpecial ? 'special' : ''}`}
        onClick={() => handleSkinChange(skin)}
        style={{
          background: colors.gradient,
          boxShadow: isActive ? colors.glow : 'none',
          animation: colors.animation || 'none',
        }}
      >
        <div className="skin-card-inner">
          <span className="skin-emoji">{skinOption.emoji}</span>
          <span className="skin-name">{skinOption.label}</span>
          {isActive && <span className="skin-check">✓</span>}
        </div>
        <div className="skin-shine" />
        {colors.isSpecial && <div className="special-glow" />}
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
