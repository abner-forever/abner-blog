import React, { useState } from 'react';
import { Upload, Input, Button, message } from 'antd';
import {
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import { UploadStatus } from '@abner-blog/upload';
import { createSimpleImageUploader } from '@services/simpleImageUploader';
import Loading from '@/components/Loading';
import './index.less';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE_MB = 5;

interface CoverUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
}

const CoverUploader: React.FC<CoverUploaderProps> = ({
  value = '',
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');

  const handleUpload = async (file: RcFile): Promise<false> => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      message.error(`图片大小不能超过 ${MAX_SIZE_MB}MB`);
      return false;
    }

    try {
      setUploading(true);
      const task = await createSimpleImageUploader('blogs').upload(file);
      if (task.status !== UploadStatus.COMPLETED || !task.url) {
        throw new Error(task.error || '上传失败');
      }
      onChange?.(task.url);
      message.success('封面上传成功');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '上传失败，请重试';
      message.error(errMsg);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleConfirmUrl = () => {
    const url = urlInputVal.trim();
    if (!url) return;
    onChange?.(url);
    setUrlInputVal('');
    setShowUrlInput(false);
  };

  const handleRemove = () => {
    onChange?.('');
    setShowUrlInput(false);
  };

  return (
    <div className="cover-uploader">
      {value ? (
        /* ── 已有封面：展示预览 + 操作按钮 ── */
        <div className="cover-uploader__preview">
          <img src={value} alt="封面预览" />
          <div className="cover-uploader__overlay">
            <Upload
              accept={ACCEPT}
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                className="overlay-btn"
              >
                更换图片
              </Button>
            </Upload>
            <Button
              icon={<DeleteOutlined />}
              className="overlay-btn overlay-btn--danger"
              onClick={handleRemove}
            >
              删除封面
            </Button>
          </div>
        </div>
      ) : (
        /* ── 无封面：上传区域 ── */
        <>
          {uploading && <Loading size="small" tip="封面上传中..." />}
          <Upload.Dragger
            accept={ACCEPT}
            showUploadList={false}
            beforeUpload={handleUpload}
            className="cover-uploader__drop"
          >
            <div className="cover-uploader__placeholder">
              <PictureOutlined className="placeholder-icon" />
              <p className="placeholder-title">点击或拖拽图片上传封面</p>
              <p className="placeholder-hint">
                支持 JPG / PNG / WebP，最大 {MAX_SIZE_MB}MB
              </p>
            </div>
          </Upload.Dragger>
        </>
      )}

      {/* URL 输入区域 */}
      <div className="cover-uploader__url-row">
        {showUrlInput ? (
          <div className="url-input-group">
            <Input
              placeholder="粘贴图片 URL"
              value={urlInputVal}
              onChange={(e) => setUrlInputVal(e.target.value)}
              onPressEnter={handleConfirmUrl}
              autoFocus
              allowClear
            />
            <Button
              type="primary"
              onClick={handleConfirmUrl}
              disabled={!urlInputVal.trim()}
            >
              确认
            </Button>
            <Button onClick={() => setShowUrlInput(false)}>取消</Button>
          </div>
        ) : (
          <Button
            type="link"
            icon={<LinkOutlined />}
            size="small"
            onClick={() => setShowUrlInput(true)}
            className="url-toggle-btn"
          >
            使用图片 URL
          </Button>
        )}
      </div>
    </div>
  );
};

export default CoverUploader;
