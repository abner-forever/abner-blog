import { Image, Progress } from 'antd';
import {
  CloseOutlined,
  PlayCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
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
        className={`uploadPlaceholder ${isDragging ? 'dragging' : ''}`}
        onClick={onOpenSelectModal}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="uploadIcon">
          <UploadOutlined />
        </div>
        <span className="uploadText">上传图片/视频</span>
        <span className="uploadHint">点击选择文件</span>
      </div>
    );
  }

  return (
    <div className="mediaGrid">
      {videos.map((item) => (
        <div
          key={item.id}
          className={`mediaItem videoItem ${isLandscape(item) ? 'landscape' : 'portrait'}`}
          onClick={() => onOpenVideoPreview(item.originalUrl || item.url)}
        >
          <div className="mediaWrapper">
            <img src={item.url} alt="" />
          </div>
          <div className="playIcon">
            <PlayCircleOutlined />
          </div>
          {uploadingItems.get(item.id) !== undefined && (
            <div className="mediaProgress">
              <Progress type="circle" percent={uploadingItems.get(item.id)} size={40} />
            </div>
          )}
          <div
            className="removeBtn"
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
              className="mediaItem imageItem"
              onClick={() => onPreviewVisibleChange(true)}
            >
              <div className="mediaWrapper">
                <Image
                  src={img.url}
                  style={{ objectFit: 'contain' }}
                  preview={true}
                  width="100%"
                  height="100%"
                />
              </div>
              {uploadingItems.get(img.id) !== undefined && (
                <div className="mediaProgress">
                  <Progress
                    type="circle"
                    percent={uploadingItems.get(img.id)}
                    size={40}
                  />
                </div>
              )}
              <div
                className="removeBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMedia(img.id);
                }}
              >
                <CloseOutlined />
              </div>
              {index === 0 && <div className="coverTag">封面</div>}
            </div>
          ))}
        </Image.PreviewGroup>
      )}

      {media.length < MAX_IMAGES && (
        <div className="addMore" onClick={onOpenSelectModal}>
          <div className="addMoreInner">
            <UploadOutlined />
            <span>添加</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
