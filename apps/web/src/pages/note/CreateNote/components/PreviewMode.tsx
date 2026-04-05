import { useMemo, useState } from 'react';
import { Image, Button, Modal } from 'antd';
import { LeftOutlined, PlayCircleOutlined, RightOutlined } from '@ant-design/icons';
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
    <div className="createNote previewMode">
      <div className="previewHeader">
        <Button onClick={onBackEdit}>返回编辑</Button>
        <span className="previewTitle">预览</span>
        <Button type="primary" onClick={onPublish} loading={uploading}>
          发布
        </Button>
      </div>
      <div className="previewContent">
        <div className="previewLayout">
          <div className="previewLeftPanel">
            {media.length > 0 && currentMedia && (
              <div className="previewGallery">
                <Image.PreviewGroup
                  preview={{
                    open: previewVisible,
                    current: currentImageIndex,
                    onOpenChange: onPreviewVisibleChange,
                    onChange: (index) => setCurrentImageIndex(index),
                  }}
                >
                  <div className="previewHiddenImages">
                    {images.map((img) => (
                      <Image key={img.id} src={img.url} preview={true} />
                    ))}
                  </div>
                </Image.PreviewGroup>

                <div
                  className={`previewMainMedia ${isCurrentVideo ? 'media-video' : 'media-image'} ${
                    isLandscape(currentMedia) ? 'media-landscape' : 'media-portrait'
                  }`}
                  onClick={handleMainMediaClick}
                >
                  {totalMediaCount > 1 && (
                    <button
                      type="button"
                      className="previewNavBtn prev"
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
                      <div className="playOverlay">
                        <PlayCircleOutlined />
                      </div>
                    </>
                  )}

                  {totalMediaCount > 1 && (
                    <button
                      type="button"
                      className="previewNavBtn next"
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
                  <div className="previewThumbnailList">
                    {mediaList.map((item, index) => (
                      <div
                        key={item.id}
                        className={`previewThumbnail ${index === currentMediaIndex ? 'active' : ''} ${
                          item.isVideo ? 'videoThumb' : ''
                        }`}
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
                            <div className="videoThumbIcon">
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

          <div className="previewRightPanel">
            {title.trim() && <div className="previewTitleText">{title}</div>}
            <div className="previewText">{content || '分享你的想法...'}</div>
            {selectedTopics.length > 0 && (
              <div className="previewTopics">
                {selectedTopics.map((id) => {
                  const topic = topics.find((t) => t.id === id);
                  return (
                    <span key={id} className="topicTag">
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
        rootClassName="videoPreviewModal"
        destroyOnHidden
      >
        <div className="videoPreviewContainer">
          <VideoPlayer src={currentVideoUrl} autoPlay />
        </div>
      </Modal>
    </div>
  );
};

export default PreviewMode;
