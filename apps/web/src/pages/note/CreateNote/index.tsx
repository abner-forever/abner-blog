import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateNote } from '@/hooks/useNotes';
import VideoPlayer from '@components/VideoPlayer';
import ActionSheet from '@components/ActionSheet';
import { getMediaUploadItems } from '@components/ActionSheet/getMediaUploadItems';
import { MAX_IMAGES, MAX_VIDEOS, topics } from './constants';
import MediaGrid from './components/MediaGrid';
import PreviewMode from './components/PreviewMode';
import UploadProgressModal from './components/UploadProgressModal';
import type { MediaItem } from './types';
import { readImageFile, readVideoFile } from './utils/media';
import {
  calculateTotalProgress,
  uploadImages,
  uploadVideoCover,
  uploadVideos,
} from './utils/upload';
import './index.less';

const CreateNote: React.FC = () => {
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingItems, setUploadingItems] = useState<Map<string, number>>(new Map());
  const [selectTypeVisible, setSelectTypeVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [videoPreviewVisible, setVideoPreviewVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  const createNoteMutation = useCreateNote();
  const images = media.filter((m) => !m.isVideo);
  const videos = media.filter((m) => m.isVideo);
  const totalProgress = calculateTotalProgress(media, images, videos, uploadingItems);

  const handleOpenSelectModal = () => {
    if (images.length >= MAX_IMAGES && videos.length >= MAX_VIDEOS) {
      return;
    }
    setSelectTypeVisible(true);
  };

  const handleSelectMediaType = (type: 'image' | 'video') => {
    setSelectTypeVisible(false);
    if (type === 'image' && images.length < MAX_IMAGES) {
      fileInputRef.current?.click();
    } else if (type === 'video' && videos.length < MAX_VIDEOS) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (images.length + imageFiles.length < MAX_IMAGES) {
          imageFiles.push(file);
        }
      } else if (file.type.startsWith('video/')) {
        if (videos.length + videoFiles.length < MAX_VIDEOS) {
          videoFiles.push(file);
        }
      }
    });

    try {
      const newMedia: MediaItem[] = [];

      for (const file of imageFiles) {
        const img = await readImageFile(file);
        newMedia.push(img);
      }

      for (const file of videoFiles) {
        const video = await readVideoFile(file);
        newMedia.push(video);
      }

      setMedia((prev) => [...prev, ...newMedia]);
    } catch (error) {
      console.error('Error reading files:', error);
    }

    e.target.value = '';
  };

  const handleRemoveMedia = (id: string) => {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item?.originalUrl) {
        URL.revokeObjectURL(item.originalUrl);
      }
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleTopicSelect = (topicId: number) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, topicId];
    });
  };

  const handlePublish = async () => {
    if (media.length === 0 || !content.trim()) {
      return;
    }

    try {
      setUploading(true);
      setUploadingItems(new Map());

      const reportUploadProgress = (id: string, progress: number) => {
        setUploadingItems((prev) => new Map(prev).set(id, progress));
      };

      const [imageUrls, videoUrls, coverUrl] = await Promise.all([
        uploadImages(images, reportUploadProgress),
        uploadVideos(videos, reportUploadProgress),
        uploadVideoCover(videos),
      ]);

      createNoteMutation.mutate(
        {
          title: title.trim() || undefined,
          content: content.trim(),
          images: imageUrls,
          videos: videoUrls,
          cover: coverUrl || imageUrls[0],
          topicId: selectedTopics[0],
        },
        {
          onSuccess: () => {
            setUploading(false);
            modal.success({
              title: '发布成功',
              content: '您的笔记已发布',
              onOk: () => navigate('/notes'),
            });
          },
          onError: () => {
            setUploading(false);
            modal.error({
              title: '发布失败',
              content: '请稍后重试',
            });
          },
        },
      );
    } catch {
      setUploading(false);
      modal.error({
        title: '发布失败',
        content: '请稍后重试',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleOpenSelectModal();
  };

  const handleOpenVideoPreview = (url: string) => {
    setCurrentVideoUrl(url);
    setVideoPreviewVisible(true);
  };

  const handleCloseVideoPreview = () => {
    setVideoPreviewVisible(false);
    setCurrentVideoUrl('');
  };

  if (previewMode) {
    return (
      <PreviewMode
        media={media}
        images={images}
        videos={videos}
        title={title}
        content={content}
        selectedTopics={selectedTopics}
        previewVisible={previewVisible}
        videoPreviewVisible={videoPreviewVisible}
        currentVideoUrl={currentVideoUrl}
        uploading={uploading}
        onBackEdit={() => setPreviewMode(false)}
        onPublish={handlePublish}
        onPreviewVisibleChange={setPreviewVisible}
        onOpenVideoPreview={handleOpenVideoPreview}
        onCloseVideoPreview={handleCloseVideoPreview}
      />
    );
  }

  return (
    <div className="createNote">
      <div className="header">
        <Button onClick={() => navigate(-1)}>取消</Button>
        <span className="title">发布笔记</span>
        <Button
          type="primary"
          onClick={handlePublish}
          loading={uploading}
          disabled={media.length === 0}
        >
          发布
        </Button>
      </div>

      <div className="form">
        <div className="mediaSection">
          <MediaGrid
            media={media}
            images={images}
            videos={videos}
            isDragging={isDragging}
            previewVisible={previewVisible}
            uploadingItems={uploadingItems}
            onPreviewVisibleChange={setPreviewVisible}
            onOpenSelectModal={handleOpenSelectModal}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onRemoveMedia={handleRemoveMedia}
            onOpenVideoPreview={handleOpenVideoPreview}
          />
        </div>

        <div className="contentSection">
          <input
            className="titleInput"
            placeholder={t('note.titlePlaceholderOptional')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <textarea
            className="contentInput"
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />
          <div className="wordCount">{content.length}/1000</div>
        </div>

        <div className="topicSection">
          <div className="topicHeader">
            <span className="topicLabel">添加话题</span>
            <span className="topicCount">已选 {selectedTopics.length}/3</span>
          </div>
          <div className="topicList">
            {topics.map((topic) => (
              <span
                key={topic.id}
                className={`topicItem ${selectedTopics.includes(topic.id) ? 'active' : ''}`}
                onClick={() => handleTopicSelect(topic.id)}
              >
                #{topic.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="footer">
        <Button block onClick={() => setPreviewMode(true)}>
          预览
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <ActionSheet
        visible={selectTypeVisible}
        onClose={() => setSelectTypeVisible(false)}
        title="选择上传类型"
        items={getMediaUploadItems(
          images.length,
          videos.length,
          () => handleSelectMediaType('image'),
          () => handleSelectMediaType('video'),
          MAX_IMAGES,
          MAX_VIDEOS,
        )}
      />

      <UploadProgressModal
        open={uploading}
        progress={totalProgress}
        imageCount={images.length}
        videoCount={videos.length}
        progressVisual={videos.length > 0 ? 'liquid' : 'ring'}
      />

      <Modal
        open={videoPreviewVisible}
        footer={null}
        onCancel={handleCloseVideoPreview}
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

export default CreateNote;
