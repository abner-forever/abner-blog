import { Image, Progress } from 'antd';
import {
  CloseOutlined,
  PlayCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import { MAX_IMAGES } from '../constants';
import type { MediaItem } from '../types';

interface MediaGridProps {
  media: MediaItem[];
  images: MediaItem[];
  videos: MediaItem[];
  isDragging: boolean;
  previewVisible: boolean;
  uploadingItems: Map<string, number>;
  onPreviewVisibleChange: (visible: boolean) => void;
  onOpenSelectModal: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveMedia: (id: string) => void;
  onOpenVideoPreview: (url: string) => void;
}

const isLandscape = (item: MediaItem) => {
  return item.width && item.height ? item.width > item.height : false;
};

const MediaGrid: React.FC<MediaGridProps> = ({
  media,
  images,
  videos,
  isDragging,
  previewVisible,
  uploadingItems,
  onPreviewVisibleChange,
  onOpenSelectModal,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveMedia,
  onOpenVideoPreview,
}) => {
  if (media.length === 0) {
    return (
      <div
        className={classNames('create-note__upload-placeholder', {
          'create-note__upload-placeholder--dragging': isDragging,
        })}
        onClick={onOpenSelectModal}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="create-note__upload-icon">
          <UploadOutlined />
        </div>
        <span className="create-note__upload-text">上传图片/视频</span>
        <span className="create-note__upload-hint">点击选择文件</span>
      </div>
    );
  }

  return (
    <div className="create-note__media-grid">
      {videos.map((item) => (
        <div
          key={item.id}
          className={classNames(
            'create-note__media-item',
            'create-note__media-item--video',
            isLandscape(item)
              ? 'create-note__media-item--landscape'
              : 'create-note__media-item--portrait',
          )}
          onClick={() => onOpenVideoPreview(item.originalUrl || item.url)}
        >
          <div className="create-note__media-wrap">
            <img src={item.url} alt="" />
          </div>
          <div className="create-note__media-play-icon">
            <PlayCircleOutlined />
          </div>
          {uploadingItems.get(item.id) !== undefined && (
            <div className="create-note__media-progress">
              <Progress type="circle" percent={uploadingItems.get(item.id)} size={40} />
            </div>
          )}
          <div
            className="create-note__media-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveMedia(item.id);
            }}
          >
            <CloseOutlined />
          </div>
        </div>
      ))}

      {images.length > 0 && (
        <Image.PreviewGroup
          preview={{
            open: previewVisible,
            onOpenChange: onPreviewVisibleChange,
          }}
        >
          {images.map((img, index) => (
            <div
              key={img.id}
              className="create-note__media-item create-note__media-item--image"
              onClick={() => onPreviewVisibleChange(true)}
            >
              <div className="create-note__media-wrap">
                <Image
                  src={img.url}
                  style={{ objectFit: 'contain' }}
                  preview={true}
                  width="100%"
                  height="100%"
                />
              </div>
              {uploadingItems.get(img.id) !== undefined && (
                <div className="create-note__media-progress">
                  <Progress
                    type="circle"
                    percent={uploadingItems.get(img.id)}
                    size={40}
                  />
                </div>
              )}
              <div
                className="create-note__media-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMedia(img.id);
                }}
              >
                <CloseOutlined />
              </div>
              {index === 0 && <div className="create-note__media-cover-tag">封面</div>}
            </div>
          ))}
        </Image.PreviewGroup>
      )}

      {media.length < MAX_IMAGES && (
        <div className="create-note__add-more" onClick={onOpenSelectModal}>
          <div className="create-note__add-more-inner">
            <UploadOutlined />
            <span>添加</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
