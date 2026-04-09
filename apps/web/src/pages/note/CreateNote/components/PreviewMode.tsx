import { useMemo, useState } from 'react';
import { Image, Button, Modal } from 'antd';
import { LeftOutlined, PlayCircleOutlined, RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import VideoPlayer from '@components/VideoPlayer';
import { topics } from '../constants';
import type { MediaItem } from '../types';

interface PreviewModeProps {
  media: MediaItem[];
  images: MediaItem[];
  videos: MediaItem[];
  title: string;
  content: string;
  selectedTopics: number[];
  previewVisible: boolean;
  videoPreviewVisible: boolean;
  currentVideoUrl: string;
  uploading: boolean;
  onBackEdit: () => void;
  onPublish: () => void;
  onPreviewVisibleChange: (visible: boolean) => void;
  onOpenVideoPreview: (url: string) => void;
  onCloseVideoPreview: () => void;
}

const isLandscape = (item: MediaItem) => {
  return item.width && item.height ? item.width > item.height : false;
};

const PreviewMode: React.FC<PreviewModeProps> = ({
  media,
  images,
  videos,
  title,
  content,
  selectedTopics,
  previewVisible,
  videoPreviewVisible,
  currentVideoUrl,
  uploading,
  onBackEdit,
  onPublish,
  onPreviewVisibleChange,
  onOpenVideoPreview,
  onCloseVideoPreview,
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const mediaList = useMemo(() => [...images, ...videos], [images, videos]);
  const totalMediaCount = mediaList.length;
  const currentMedia = mediaList[currentMediaIndex];
  const isCurrentVideo = Boolean(currentMedia?.isVideo);

  const getImageIndexByMediaIndex = (mediaIndex: number) => {
    const target = mediaList[mediaIndex];
    if (!target || target.isVideo) return 0;
    const imageIndex = images.findIndex((img) => img.id === target.id);
    return imageIndex >= 0 ? imageIndex : 0;
  };

  const handlePrevMedia = () => {
    if (totalMediaCount <= 1) return;
    setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : totalMediaCount - 1));
  };

  const handleNextMedia = () => {
    if (totalMediaCount <= 1) return;
    setCurrentMediaIndex((prev) => (prev < totalMediaCount - 1 ? prev + 1 : 0));
  };

  const handleMainMediaClick = () => {
    if (!currentMedia) return;
    if (currentMedia.isVideo) {
      onOpenVideoPreview(currentMedia.originalUrl || currentMedia.url);
      return;
    }
    setCurrentImageIndex(getImageIndexByMediaIndex(currentMediaIndex));
    onPreviewVisibleChange(true);
  };

  return (
    <div className="create-note create-note--preview">
      <div className="create-note__preview-header">
        <Button onClick={onBackEdit}>返回编辑</Button>
        <span className="create-note__preview-title">预览</span>
        <Button type="primary" onClick={onPublish} loading={uploading}>
          发布
        </Button>
      </div>
      <div className="create-note__preview-content">
        <div className="create-note__preview-layout">
          <div className="create-note__preview-left">
            {media.length > 0 && currentMedia && (
              <div className="create-note__preview-gallery">
                <Image.PreviewGroup
                  preview={{
                    open: previewVisible,
                    current: currentImageIndex,
                    onOpenChange: onPreviewVisibleChange,
                    onChange: (index) => setCurrentImageIndex(index),
                  }}
                >
                  <div className="create-note__preview-hidden-images">
                    {images.map((img) => (
                      <Image key={img.id} src={img.url} preview={true} />
                    ))}
                  </div>
                </Image.PreviewGroup>

                <div
                  className={classNames(
                    'create-note__preview-main',
                    isCurrentVideo ? 'create-note__preview-main--video' : 'create-note__preview-main--image',
                    isLandscape(currentMedia)
                      ? 'create-note__preview-main--landscape'
                      : 'create-note__preview-main--portrait',
                  )}
                  onClick={handleMainMediaClick}
                >
                  {totalMediaCount > 1 && (
                    <button
                      type="button"
                      className="create-note__preview-nav create-note__preview-nav--prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevMedia();
                      }}
                      aria-label="上一项"
                    >
                      <LeftOutlined />
                    </button>
                  )}

                  {!isCurrentVideo ? (
                    <Image
                      src={currentMedia.url}
                      style={{ objectFit: 'contain' }}
                      preview={false}
                      width="100%"
                      height="100%"
                    />
                  ) : (
                    <>
                      <VideoPlayer
                        src={currentMedia.originalUrl || currentMedia.url}
                        poster={currentMedia.url}
                        autoPlay
                        muted
                        loop
                        showControls={false}
                      />
                      <div className="create-note__preview-play-overlay">
                        <PlayCircleOutlined />
                      </div>
                    </>
                  )}

                  {totalMediaCount > 1 && (
                    <button
                      type="button"
                      className="create-note__preview-nav create-note__preview-nav--next"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextMedia();
                      }}
                      aria-label="下一项"
                    >
                      <RightOutlined />
                    </button>
                  )}
                </div>

                {totalMediaCount > 1 && (
                  <div className="create-note__preview-thumbs">
                    {mediaList.map((item, index) => (
                      <div
                        key={item.id}
                        className={classNames('create-note__preview-thumb', {
                          'create-note__preview-thumb--active': index === currentMediaIndex,
                          'create-note__preview-thumb--video': item.isVideo,
                        })}
                        onClick={() => setCurrentMediaIndex(index)}
                      >
                        {!item.isVideo ? (
                          <Image src={item.url} preview={false} style={{ objectFit: 'cover' }} />
                        ) : (
                          <>
                            <VideoPlayer
                              src={item.originalUrl || item.url}
                              poster={item.url}
                              muted
                              loop
                              autoPlay={false}
                              playing={false}
                              showControls={false}
                            />
                            <div className="create-note__preview-video-icon">
                              <PlayCircleOutlined />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="create-note__preview-right">
            {title.trim() && <div className="create-note__preview-title-text">{title}</div>}
            <div className="create-note__preview-text">{content || '分享你的想法...'}</div>
            {selectedTopics.length > 0 && (
              <div className="create-note__preview-topics">
                {selectedTopics.map((id) => {
                  const topic = topics.find((t) => t.id === id);
                  return (
                    <span key={id} className="create-note__preview-topic-tag">
                      #{topic?.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={videoPreviewVisible}
        footer={null}
        onCancel={onCloseVideoPreview}
        width="100%"
        centered
        rootClassName="create-note__video-preview-modal"
        destroyOnHidden
      >
        <div className="create-note__video-preview-container">
          <VideoPlayer src={currentVideoUrl} autoPlay />
        </div>
      </Modal>
    </div>
  );
};

export default PreviewMode;
