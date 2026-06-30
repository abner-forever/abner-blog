import React, { useCallback, useRef } from 'react';
import { message, Popconfirm } from 'antd';
import { DownloadOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { STORAGE_KEY } from '../../constants';
import type { ChatSession } from '../../types';

interface DataSheetContentProps {
  onActionComplete?: () => void;
}

const DataSheetContent: React.FC<DataSheetContentProps> = ({ onActionComplete }) => {
  const { t } = useTranslation();
  const { createNewSession } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (!savedSessions) {
      message.warning(t('chat.noDataToExport', { defaultValue: '没有可导出的数据' }));
      return;
    }
    const blob = new Blob([savedSessions], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-sessions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(t('chat.exportSuccess', { defaultValue: '导出成功' }));
  }, [t]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as ChatSession[];
          if (!Array.isArray(data)) {
            message.error(t('chat.importInvalidFormat', { defaultValue: '无效的文件格式' }));
            return;
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          message.success(t('chat.importSuccess', { defaultValue: '导入成功，刷新后生效' }));
          onActionComplete?.();
        } catch {
          message.error(t('chat.importInvalidFormat', { defaultValue: '无效的文件格式' }));
        }
      };
      reader.readAsText(file);
      if (e.target) e.target.value = '';
    },
    [t, onActionComplete],
  );

  const handleClearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    createNewSession();
    message.success(t('chat.clearSuccess', { defaultValue: '已清除所有记录' }));
    onActionComplete?.();
  }, [createNewSession, t, onActionComplete]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      <div className="sub-sheet-data-actions">
        <div className="sub-sheet-data-action-item" onClick={handleImportClick}>
          <UploadOutlined className="sub-sheet-data-action-icon" />
          <div className="sub-sheet-data-action-info">
            <span className="sub-sheet-data-action-label">
              {t('chat.importChatRecords', { defaultValue: '导入聊天记录' })}
            </span>
            <span className="sub-sheet-data-action-desc">
              {t('chat.importChatRecordsHint', { defaultValue: '从 JSON 文件导入会话' })}
            </span>
          </div>
        </div>

        <div className="sub-sheet-data-action-item" onClick={handleExport}>
          <DownloadOutlined className="sub-sheet-data-action-icon" />
          <div className="sub-sheet-data-action-info">
            <span className="sub-sheet-data-action-label">
              {t('chat.exportChatRecords', { defaultValue: '导出聊天记录' })}
            </span>
            <span className="sub-sheet-data-action-desc">
              {t('chat.exportChatRecordsHint', { defaultValue: '保存为 JSON 文件' })}
            </span>
          </div>
        </div>

        <Popconfirm
          title={t('chat.clearAllConfirm', { defaultValue: '确定清除所有聊天记录？' })}
          onConfirm={handleClearAll}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <div className="sub-sheet-data-action-item danger">
            <DeleteOutlined className="sub-sheet-data-action-icon" />
            <div className="sub-sheet-data-action-info">
              <span className="sub-sheet-data-action-label">
                {t('chat.clearAllRecords', { defaultValue: '清除所有记录' })}
              </span>
              <span className="sub-sheet-data-action-desc">
                {t('chat.clearAllRecordsHint', { defaultValue: '删除所有本地和服务端会话' })}
              </span>
            </div>
          </div>
        </Popconfirm>
      </div>
    </>
  );
};

export default DataSheetContent;
