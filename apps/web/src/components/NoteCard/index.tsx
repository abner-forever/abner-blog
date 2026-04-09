import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'antd';
import { HeartOutlined, MessageOutlined } from '@ant-design/icons';
import classNames from 'classnames';
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

const COVER_ASPECT_CLASS: Record<CoverRatioPreset, string> = {
  '9-16': 'note-card__thumb--aspect-9-16',
  '4-3': 'note-card__thumb--aspect-4-3',
  '3-4': 'note-card__thumb--aspect-3-4',
};

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
        <div
          className={classNames(
            'note-card__thumb',
            'note-card__thumb--cover',
            COVER_ASPECT_CLASS[coverRatio],
          )}
        >
          <img src={cover} alt={title || content} loading="lazy" />
        </div>
      );
    }

    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div className="note-card__thumb note-card__thumb--single">
          <Image src={images[0]} preview={false} loading="lazy" />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="note-card__thumb-grid note-card__thumb-grid--two">
          {images.map((img, index) => (
            <Image key={index} src={img} preview={false} loading="lazy" />
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="note-card__thumb-grid note-card__thumb-grid--three">
          <Image
            src={images[0]}
            preview={false}
            loading="lazy"
            className="note-card__thumb-leading"
          />
          <div className="note-card__thumb-stack">
            {images.slice(1).map((img, index) => (
              <Image key={index} src={img} preview={false} loading="lazy" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="note-card__thumb-grid note-card__thumb-grid--four">
        {images.slice(0, 4).map((img, index) => (
          <div key={index} className="note-card__thumb-cell">
            <Image src={img} preview={false} loading="lazy" />
            {index === 3 && images.length > 4 && (
              <div className="note-card__thumb-more">+{images.length - 4}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={classNames('note-card', className)} onClick={handleClick}>
      <div className="note-card__media">
        {renderImages()}
        <div className="note-card__overlay">
          <div className="note-card__actions">
            <div className="note-card__action" onClick={handleActionClick}>
              <HeartOutlined />
              <span>{likes}</span>
            </div>
            <div className="note-card__action" onClick={handleActionClick}>
              <MessageOutlined />
              <span>{comments}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="note-card__body">
        {(title?.trim() || content.trim()) && (
          <p className="note-card__excerpt">{title?.trim() || content.trim()}</p>
        )}
        {topics.length > 0 && (
          <div className="note-card__topics">
            {topics.map((topic, index) => (
              <span
                key={index}
                className="note-card__topic-tag"
                onClick={(e) => handleTopicClick(e, topicId)}
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
        {location && (
          <div className="note-card__location">
            <span className="note-card__location-icon">📍</span>
            <span>{location}</span>
          </div>
        )}
        <div className="note-card__author">
          <div className="note-card__avatar">
            {avatar ? (
              <img src={avatar} alt={nickname} loading="lazy" />
            ) : (
              <div className="note-card__avatar-fallback">
                {nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="note-card__nickname">{nickname}</span>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
