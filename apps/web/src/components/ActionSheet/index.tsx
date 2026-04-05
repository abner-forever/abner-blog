import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useDevice } from '@hooks/useDevice';
import type { ActionSheetItem } from './types';
import './index.less';

export type { ActionSheetItem };

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
  cancelText?: string;
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title = '请选择',
  items,
  cancelText = '取消',
}) => {
  const deviceType = useDevice();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  const handleItemClick = (item: ActionSheetItem) => {
    if (item.disabled) return;
    item.onClick?.();
    onClose();
  };

  // Handle touch/mouse start for dragging
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  }, []);

  // Handle touch/mouse move for dragging
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - startYRef.current;
    // Only allow dragging down (positive delta)
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  }, [isDragging]);

  // Handle touch/mouse end for dragging
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    const drawerHeight = drawerRef.current?.offsetHeight || 300;
    const closeThreshold = drawerHeight / 2;

    // If dragged down more than half the drawer height, close
    if (dragY > closeThreshold) {
      setIsDragging(false);
      onClose();
      setDragY(0);
    } else {
      // First remove dragging class to enable CSS transition
      setIsDragging(false);
      // Then reset position after a small delay for smooth animation
      setTimeout(() => {
        setDragY(0);
      }, 10);
    }
  }, [isDragging, dragY, onClose]);

  // Add global event listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientY);
    };
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset drag state when closed
  useEffect(() => {
    if (!visible) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [visible]);

  // Handle click on handle bar to close
  const handleHandleClick = () => {
    onClose();
  };

  // 移动端：底部抽屉样式
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    return (
      <div
        className={`actionSheetOverlay ${visible ? 'visible' : ''}`}
        onClick={onClose}
      >
        <div
          ref={drawerRef}
          className={`actionSheetDrawer ${visible ? 'visible' : ''} ${isDragging ? 'dragging' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={isDragging ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          <div
            className="actionSheetHeader"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleDragStart(e.touches[0].clientY);
              }
            }}
          >
            <div className="actionSheetHandle" onClick={handleHandleClick} />
            <span className="actionSheetTitle">{title}</span>
          </div>

          <div className="actionSheetContent">
            {items.map((item) => (
              <div
                key={item.key}
                className={`actionSheetItem ${item.disabled ? 'disabled' : ''} ${item.danger ? 'danger' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {item.icon && (
                  <div className={`actionSheetItemIcon ${item.danger ? 'dangerIcon' : ''}`}>
                    {item.icon}
                  </div>
                )}
                <div className="actionSheetItemInfo">
                  <span className="actionSheetItemTitle">{item.title}</span>
                  {item.description && (
                    <span className="actionSheetItemDesc">{item.description}</span>
                  )}
                </div>
                {item.badge !== undefined && (
                  <div className="actionSheetItemBadge">{item.badge}</div>
                )}
              </div>
            ))}
          </div>

          <div className="actionSheetFooter">
            <Button block size="large" onClick={onClose}>
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PC 端：居中模态框样式
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      closable={false}
      width={400}
      className="actionSheetModal"
    >
      <div className="actionSheetModalContent">
        <div className="actionSheetHeader">
          <span className="actionSheetTitle">{title}</span>
          <div className="actionSheetClose" onClick={onClose}>
            <CloseOutlined />
          </div>
        </div>

        <div className="actionSheetContent">
          {items.map((item) => (
            <div
              key={item.key}
              className={`actionSheetItem ${item.disabled ? 'disabled' : ''} ${item.danger ? 'danger' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && (
                <div className={`actionSheetItemIcon ${item.danger ? 'dangerIcon' : ''}`}>
                  {item.icon}
                </div>
              )}
              <div className="actionSheetItemInfo">
                <span className="actionSheetItemTitle">{item.title}</span>
                {item.description && (
                  <span className="actionSheetItemDesc">{item.description}</span>
                )}
              </div>
              {item.badge !== undefined && (
                <div className="actionSheetItemBadge">{item.badge}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ActionSheet;
