import { useEffect, useRef } from 'react';
import { PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  dateLabel?: string;
  timeLabel?: string;
  onAddEvent: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  dateLabel,
  timeLabel,
  onAddEvent,
  onClose,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // 延迟绑定，避免当前右键事件触发关闭
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="calendar-context-menu"
      style={{ left: x, top: y }}
    >
      <div className="context-menu-item" onClick={onAddEvent}>
        <PlusOutlined className="context-menu-icon" />
        <span>{t('calendar.add')}</span>
      </div>
      {(dateLabel || timeLabel) && (
        <div className="context-menu-info">
          {dateLabel && <span>{dateLabel}</span>}
          {timeLabel && (
            <span className="context-menu-time">
              <ClockCircleOutlined />
              {timeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
