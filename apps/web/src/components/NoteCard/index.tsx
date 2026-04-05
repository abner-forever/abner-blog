import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'antd';
import { HeartOutlined, MessageOutlined } from '@ant-design/icons';
import './index.less';

export interface NoteCardProps {
  id: number;
  avatar?: string;
  nickname: string;
  title?: string;
  cover?: string;
  images: string[];
  content: string;
  likes: number;
  comments: number;
  className?: string;
  topics?: string[];
  topicId?: number;
  location?: string;
  time?: string;
}

type CoverRatioPreset = '9-16' | '4-3' | '3-4';

const COVER_RATIO_PRESETS: Array<{ key: CoverRatioPreset; ratio: number }> = [
  { key: '9-16', ratio: 9 / 16 },
  { key: '4-3', ratio: 4 / 3 },
  { key: '3-4', ratio: 3 / 4 },
];

const getClosestCoverRatio = (width: number, height: number): CoverRatioPreset => {
  if (!width || !height) {
    return '3-4';
  }

  const actualRatio = width / height;
  const matchedPreset = COVER_RATIO_PRESETS.reduce((closest, preset) => {
    const currentDiff = Math.abs(actualRatio - preset.ratio);
    const closestDiff = Math.abs(actualRatio - closest.ratio);
    return currentDiff < closestDiff ? preset : closest;
  });

  return matchedPreset.key;
};

const NoteCard: React.FC<NoteCardProps> = ({
  id,
  avatar,
  nickname,
  title,
  cover,
  images,
  content,
  likes,
  comments,
  className,
  topics = [],
  topicId,
  location,
}) => {
  const navigate = useNavigate();
  const [coverRatio, setCoverRatio] = useState<CoverRatioPreset>('3-4');

  const handleClick = () => {
    navigate(`/notes/${id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTopicClick = (e: React.MouseEvent, tId?: number) => {
    e.stopPropagation();
    if (tId) {
      navigate(`/notes/topics/${tId}`);
    }
  };

  useEffect(() => {
    if (!cover) {
      setCoverRatio('3-4');
      return;
    }

    const image = new window.Image();
    image.src = cover;
    image.onload = () => {
      setCoverRatio(getClosestCoverRatio(image.naturalWidth, image.naturalHeight));
    };
    image.onerror = () => {
      setCoverRatio('3-4');
    };
  }, [cover]);

  const renderImages = () => {
    if (cover) {
      return (
        <div className={`singleImage coverImage ratio-${coverRatio}`}>
          <img src={cover} alt={title || content} loading="lazy" />
        </div>
      );
    }

    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div className="singleImage">
          <Image src={images[0]} preview={false} />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="twoImages">
          {images.map((img, index) => (
            <Image key={index} src={img} preview={false} />
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="threeImages">
          <Image src={images[0]} preview={false} className="firstImage" />
          <div className="subImages">
            {images.slice(1).map((img, index) => (
              <Image key={index} src={img} preview={false} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="fourImages">
        {images.slice(0, 4).map((img, index) => (
          <div key={index} className="imageWrapper">
            <Image src={img} preview={false} />
            {index === 3 && images.length > 4 && (
              <div className="moreOverlay">+{images.length - 4}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`noteCard ${className || ''}`} onClick={handleClick}>
      <div className="imageContainer">
        {renderImages()}
        <div className="imageOverlay">
          <div className="noteCardActions">
            <div className="noteCardActionItem" onClick={handleActionClick}>
              <HeartOutlined />
              <span>{likes}</span>
            </div>
            <div className="noteCardActionItem" onClick={handleActionClick}>
              <MessageOutlined />
              <span>{comments}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="content">
        {(title?.trim() || content.trim()) && (
          <p className="cardDesc">{title?.trim() || content.trim()}</p>
        )}
        {topics.length > 0 && (
          <div className="topics">
            {topics.map((topic, index) => (
              <span
                key={index}
                className="topic"
                onClick={(e) => handleTopicClick(e, topicId)}
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
        {location && (
          <div className="location">
            <span className="locationIcon">📍</span>
            <span>{location}</span>
          </div>
        )}
        <div className="userInfo">
          <div className="avatar">
            {avatar ? (
              <img src={avatar} alt={nickname} loading="lazy" />
            ) : (
              <div className="defaultAvatar">
                {nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="nickname">{nickname}</span>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
