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

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
  }, []);

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging) return;
      const deltaY = clientY - startYRef.current;
      if (deltaY > 0) {
        setDragY(deltaY);
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    const drawerHeight = drawerRef.current?.offsetHeight || 300;
    const closeThreshold = drawerHeight / 2;

    if (dragY > closeThreshold) {
      setIsDragging(false);
      onClose();
      setDragY(0);
    } else {
      setIsDragging(false);
      setTimeout(() => {
        setDragY(0);
      }, 10);
    }
  }, [isDragging, dragY, onClose]);

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

  useEffect(() => {
    if (!visible) {
      setDragY(0);
      setIsDragging(false);
    }
  }, [visible]);

  const handleHandleClick = () => {
    onClose();
  };

  if (deviceType === 'mobile' || deviceType === 'tablet') {
    return (
      <div
        className={`action-sheet__overlay${visible ? ' action-sheet__overlay--visible' : ''}`}
        onClick={onClose}
      >
        <div
          ref={drawerRef}
          className={`action-sheet__drawer${visible ? ' action-sheet__drawer--visible' : ''}${isDragging ? ' action-sheet__drawer--dragging' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={isDragging ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          <div
            className="action-sheet__header"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleDragStart(e.touches[0].clientY);
              }
            }}
          >
            <div className="action-sheet__handle" onClick={handleHandleClick} />
            <span className="action-sheet__title">{title}</span>
          </div>

          <div className="action-sheet__content">
            {items.map((item) => (
              <div
                key={item.key}
                className={`action-sheet__item${item.disabled ? ' action-sheet__item--disabled' : ''}${item.danger ? ' action-sheet__item--danger' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                {item.icon && (
                  <div
                    className={`action-sheet__item-icon${item.danger ? ' action-sheet__item-icon--danger' : ''}`}
                  >
                    {item.icon}
                  </div>
                )}
                <div className="action-sheet__item-info">
                  <span className="action-sheet__item-title">{item.title}</span>
                  {item.description && (
                    <span className="action-sheet__item-desc">{item.description}</span>
                  )}
                </div>
                {item.badge !== undefined && (
                  <div className="action-sheet__item-badge">{item.badge}</div>
                )}
              </div>
            ))}
          </div>

          <div className="action-sheet__footer">
            <Button block size="large" onClick={onClose}>
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      closable={false}
      width={400}
      className="action-sheet-modal"
    >
      <div className="action-sheet__modal-content">
        <div className="action-sheet__header">
          <span className="action-sheet__title">{title}</span>
          <div className="action-sheet__close" onClick={onClose}>
            <CloseOutlined />
          </div>
        </div>

        <div className="action-sheet__content">
          {items.map((item) => (
            <div
              key={item.key}
              className={`action-sheet__item${item.disabled ? ' action-sheet__item--disabled' : ''}${item.danger ? ' action-sheet__item--danger' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && (
                <div
                  className={`action-sheet__item-icon${item.danger ? ' action-sheet__item-icon--danger' : ''}`}
                >
                  {item.icon}
                </div>
              )}
              <div className="action-sheet__item-info">
                <span className="action-sheet__item-title">{item.title}</span>
                {item.description && (
                  <span className="action-sheet__item-desc">{item.description}</span>
                )}
              </div>
              {item.badge !== undefined && (
                <div className="action-sheet__item-badge">{item.badge}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ActionSheet;
