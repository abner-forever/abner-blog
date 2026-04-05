import { PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';
import type { ActionSheetItem } from './types';

export const getMediaUploadItems = (
  imageCount: number,
  videoCount: number,
  onSelectImage: () => void,
  onSelectVideo: () => void,
  maxImages = 9,
  maxVideos = 1,
): ActionSheetItem[] => [
  {
    key: 'image',
    icon: <PictureOutlined />,
    title: '图片',
    description: `最多上传${maxImages}张`,
    badge: `${imageCount}/${maxImages}`,
    disabled: imageCount >= maxImages,
    onClick: onSelectImage,
  },
  {
    key: 'video',
    icon: <VideoCameraOutlined />,
    title: '视频',
    description: '最长5分钟',
    badge: `${videoCount}/${maxVideos}`,
    disabled: videoCount >= maxVideos,
    onClick: onSelectVideo,
  },
];
