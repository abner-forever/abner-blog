import { useState, useCallback } from 'react';
import classNames from 'classnames';
import { useParams, useNavigate } from 'react-router-dom';
import { Image, Button, message, Modal, Input, Popconfirm, Drawer } from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  ShareAltOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useNoteDetail,
  useNoteComments,
  useToggleNoteLike,
  useCollectNote,
  useDeleteNote,
} from '@/hooks/useNotes';
import {
  useMyCollections,
  useCreateCollection,
  type NoteCollection,
} from '@/hooks/useNoteCollections';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import DataList from '@/components/DataList';
import VideoPlayer from '@components/VideoPlayer';
import CustomEmpty from '@/components/CustomEmpty';
import Loading from '@/components/Loading';
import { CommentSection } from '@components/CommentSection';
import { CommentItem } from '@components/CommentItem';
import './index.less';

const NoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated: isLoggedIn, user } = useAuth();
  const noteId = Number(id);
  const queryClient = useQueryClient();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [commentsDrawerVisible, setCommentsDrawerVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [videoDimensions, setVideoDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});

  const { data: note, isLoading: noteLoading } = useNoteDetail(noteId);
  const { data: noteComments, isLoading: commentsLoading } = useNoteComments(noteId);
  const likeMutation = useToggleNoteLike();
  const collectMutation = useCollectNote();
  const deleteNoteMutation = useDeleteNote();

  const { data: collections } = useMyCollections();
  const createCollectionMutation = useCreateCollection();

  const handleLike = () => {
    if (!isLoggedIn) {
      message.warning(t('auth.pleaseLogin'));
      return;
    }
    likeMutation.mutate(noteId);
  };

  const handleCollect = () => {
    if (!isLoggedIn) {
      message.warning(t('auth.pleaseLogin'));
      return;
    }
    setCollectModalVisible(true);
  };

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: note?.content?.slice(0, 50) || '笔记分享',
          text: note?.content?.slice(0, 100) || '',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success(t('note.shareLinkCopied'));
    } catch {
      message.error(t('note.shareFailed'));
    }
  }, [note, t]);

  const handleCollectToCollection = (collectionId: number, collectionName?: string) => {
    collectMutation.mutate(
      { noteId, collectionId },
      {
        onSuccess: () => {
          message.success(
            t('note.noteCollected', { name: collectionName?.trim() || t('note.collect') }),
          );
          setCollectModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ['note', noteId] });
          queryClient.invalidateQueries({ queryKey: ['noteCollections'] });
        },
      },
    );
  };

  const handleDeleteNote = () => {
    if (!isLoggedIn) {
      message.warning(t('auth.pleaseLogin'));
      return;
    }

    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => {
        message.success(t('note.deleteSuccess'));
        navigate('/notes');
      },
      onError: () => {
        message.error(t('note.deleteFailed'));
      },
    });
  };

  const handleCreateCollectionAndCollect = () => {
    if (!newCollectionName.trim()) return;
    createCollectionMutation.mutate(
      { name: newCollectionName },
      {
        onSuccess: (data) => {
          const newId = (data as NoteCollection)?.id;
          if (newId) {
            handleCollectToCollection(newId, newCollectionName.trim());
          }
          setNewCollectionName('');
        },
        onError: (err: unknown) => {
          const msg =
            (err as { message?: string })?.message || t('note.createCollectionFailed');
          message.error(msg);
        },
      },
    );
  };

  const refreshNoteDetailAndComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['noteComments', noteId] });
    queryClient.invalidateQueries({ queryKey: ['comments', 'note', noteId] });
  }, [noteId, queryClient]);

  if (noteLoading) {
    return (
      <div className="note-detail__loading">
        <Loading size="small" tip={t('note.loading')} />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="note-detail__empty">
        <CustomEmpty tip="笔记不存在" />
      </div>
    );
  }

  // 计算媒体总数
  const totalMediaCount = (note.images?.length || 0) + (note.videos?.length || 0);
  // 判断当前显示的是图片还是视频
  const isCurrentImage = currentImageIndex < (note.images?.length || 0);
  const currentImage = isCurrentImage ? note.images?.[currentImageIndex] : undefined;
  const currentVideo = !isCurrentImage ? note.videos?.[currentImageIndex - (note.images?.length || 0)] : undefined;
  const currentVideoSize = currentVideo
    ? videoDimensions[currentVideo]
    : undefined;
  const isCurrentVideoLandscape = currentVideoSize
    ? currentVideoSize.width >= currentVideoSize.height
    : false;
  const isAuthor = user?.id === note.author.id;
  const previewComments = (noteComments || []).slice(0, 3);
  const hasMoreComments = (note.commentCount || 0) > 3;

  return (
    <div className="note-detail">
      <div className="note-detail__pc-layout">
        <div className="note-detail__left">
          <div className="note-detail__gallery">
            <Image.PreviewGroup
              preview={{
                open: previewOpen,
                onOpenChange: (open) => setPreviewOpen(open),
              }}
            >
              <div
                className={classNames('note-detail__main-media', {
                  'note-detail__main-media--video': !isCurrentImage,
                  'note-detail__main-media--image': isCurrentImage,
                  'note-detail__main-media--landscape':
                    !isCurrentImage && isCurrentVideoLandscape,
                  'note-detail__main-media--portrait':
                    !isCurrentImage && !isCurrentVideoLandscape,
                })}
              >
                {totalMediaCount > 0 ? (
                  <>
                    {totalMediaCount > 1 && (
                      <div
                        className="note-detail__gallery-nav note-detail__gallery-nav--prev"
                        onClick={() =>
                          setCurrentImageIndex(
                            currentImageIndex > 0
                              ? currentImageIndex - 1
                              : totalMediaCount - 1,
                          )
                        }
                      >
                        <LeftOutlined />
                      </div>
                    )}
                    {isCurrentImage ? (
                      <Image
                        src={currentImage}
                        style={{ objectFit: 'contain' }}
                      />
                    ) : currentVideo ? (
                      <div
                        className={classNames('note-detail__video-wrap', {
                          'note-detail__video-wrap--landscape': isCurrentVideoLandscape,
                          'note-detail__video-wrap--portrait': !isCurrentVideoLandscape,
                        })}
                      >
                        <VideoPlayer
                          key={currentVideo}
                          poster={note.cover}
                          src={currentVideo}
                          onLoadedMetadata={(_, videoWidth, videoHeight) => {
                            if (!currentVideo) return;
                            setVideoDimensions((prev) => ({
                              ...prev,
                              [currentVideo]: {
                                width: videoWidth,
                                height: videoHeight,
                              },
                            }));
                          }}
                        />
                      </div>
                    ) : null}
                    {totalMediaCount > 1 && (
                      <div
                        className="note-detail__gallery-nav note-detail__gallery-nav--next"
                        onClick={() =>
                          setCurrentImageIndex(
                            currentImageIndex < totalMediaCount - 1
                              ? currentImageIndex + 1
                              : 0,
                          )
                        }
                      >
                        <RightOutlined />
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              {totalMediaCount > 1 && (
                <div className="note-detail__thumbs">
                  {note.images?.map((img, index) => (
                    <div
                      key={`img-${index}`}
                      className={classNames('note-detail__thumb', {
                        'note-detail__thumb--active': index === currentImageIndex,
                      })}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image src={img} style={{ objectFit: 'contain' }} />
                    </div>
                  ))}
                  {note.videos?.map((video, index) => (
                    <div
                      key={`video-${index}`}
                      className={classNames(
                        'note-detail__thumb',
                        'note-detail__thumb--video',
                        {
                          'note-detail__thumb--active':
                            index + (note.images?.length || 0) === currentImageIndex,
                        },
                      )}
                      onClick={() => setCurrentImageIndex((note.images?.length || 0) + index)}
                    >
                      <VideoPlayer
                        poster={note.cover}
                        src={video}
                        muted
                        loop
                        showControls={false}
                      />
                      <div className="note-detail__video-play-icon">
                        <PlayCircleOutlined />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Image.PreviewGroup>
          </div>
        </div>
        <div className="note-detail__right">
          <div className="note-detail__author">
            <div className="note-detail__author-avatar">
              <Image
                src={note.author.avatar}
                style={{ objectFit: 'cover' }}
                width={40}
                height={40}
              />
            </div>
            <span className="note-detail__author-name">{note.author.nickname}</span>
            <Button type="primary" size="small">
              {t('note.follow')}
            </Button>
          </div>
          <div className="note-detail__body">
            {note.title && <h2 className="note-detail__title">{note.title}</h2>}
            <p>{note.content}</p>
            {note.topic && (
              <div className="note-detail__topics">
                <span
                  className="note-detail__topic-tag"
                  onClick={() => navigate(`/notes/topics/${note.topic!.id}`)}
                >
                  #{note.topic.name}
                </span>
              </div>
            )}
            {note.location && (
              <div className="note-detail__location">
                <span>📍</span>
                <span>{note.location}</span>
              </div>
            )}
            <div className="note-detail__time">
              {new Date(note.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="note-detail__actions">
            <div className="note-detail__action" onClick={handleLike}>
              {note.isLiked ? (
                <HeartFilled style={{ color: '#ff4d4f' }} />
              ) : (
                <HeartOutlined />
              )}
              <span>{note.likeCount}</span>
            </div>
            <div className="note-detail__action" onClick={handleCollect}>
              {note.isFavorited ? (
                <StarOutlined style={{ color: '#faad14' }} />
              ) : (
                <StarOutlined />
              )}
              <span>{note.favoriteCount}</span>
            </div>
            <div className="note-detail__action" onClick={handleShare}>
              <ShareAltOutlined />
              <span>{t('note.share')}</span>
            </div>
            {isAuthor && (
              <Popconfirm
                title={t('note.deleteNoteConfirm')}
                onConfirm={handleDeleteNote}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
              >
                <div className="note-detail__action">
                  <DeleteOutlined />
                  <span>{t('note.deleteNote')}</span>
                </div>
              </Popconfirm>
            )}
          </div>
          <div className="note-detail__comments note-detail__comments--compact">
            <h3 className="note-detail__comments-title">
              {t('note.comments')} {note.commentCount}
            </h3>
            {hasMoreComments && (
              <Button
                type="link"
                className="note-detail__comments-view-all"
                onClick={() => setCommentsDrawerVisible(true)}
              >
                {t('note.viewAllComments')}
              </Button>
            )}
            {note.commentCount === 0 && (
              <Button
                type="link"
                className="note-detail__comments-view-all"
                onClick={() => setCommentsDrawerVisible(true)}
              >
                {t('common.writeComment')}
              </Button>
            )}
            <div className="note-detail__comments-preview">
              {commentsLoading ? (
                <div className="note-detail__comments-loading">
                  <Loading size="small" tip={t('note.loading')} />
                </div>
              ) : previewComments.length > 0 ? (
                previewComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="note-detail__comment-preview"
                    onClick={() => setCommentsDrawerVisible(true)}
                  >
                    <CommentItem
                      comment={{
                        id: comment.id,
                        content: comment.content,
                        createdAt: String(comment.createdAt),
                        updatedAt: String(comment.createdAt),
                        author: {
                          id: comment.author.id,
                          username: comment.author.username,
                          nickname: comment.author.nickname,
                          avatar: comment.author.avatar,
                        },
                        likeCount: comment.likeCount,
                        isLiked: comment.isLiked,
                      }}
                      variant="root"
                      onLike={async () => {}}
                      onReply={() => setCommentsDrawerVisible(true)}
                    />
                  </div>
                ))
              ) : (
                <div
                  className="note-detail__comments-empty"
                  onClick={() => setCommentsDrawerVisible(true)}
                >
                  {t('comment.emptyPrompt')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        title={`${t('note.comments')} ${note.commentCount}`}
        placement="right"
        size={500}
        open={commentsDrawerVisible}
        onClose={() => setCommentsDrawerVisible(false)}
        rootClassName="note-detail__comments-drawer"
      >
        <div className="note-detail__drawer-comments">
          <CommentSection
            resourceType="note"
            resourceId={noteId}
            layout="compact"
            onCommentAdded={refreshNoteDetailAndComments}
            onCommentDeleted={refreshNoteDetailAndComments}
          />
        </div>
      </Drawer>

      <div className="note-detail__mobile-header">
        <div className="note-detail__mobile-back" onClick={() => navigate(-1)}>
          <CloseOutlined />
        </div>
      </div>

      {/* Collection Modal */}
      <Modal
        title={t('note.collectToCollection')}
        open={collectModalVisible}
        onCancel={() => setCollectModalVisible(false)}
        footer={null}
      >
        <div className="note-detail__collection-modal">
          <div className="note-detail__collection-create">
            <Input
              placeholder={t('note.collectionNamePlaceholder')}
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onPressEnter={handleCreateCollectionAndCollect}
            />
            <Button onClick={handleCreateCollectionAndCollect}>
              {t('note.createCollection')}
            </Button>
          </div>
          <DataList
            className="note-detail__collection-list"
            dataSource={collections || []}
            rowKey={(c) => c.id}
            rowClassName="note-detail__collection-item"
            rowProps={(collection) => ({
              onClick: () =>
                handleCollectToCollection(collection.id, collection.name),
            })}
            empty={<div className="note-detail__collection-empty">{t('note.noCollections')}</div>}
            renderItem={(collection) => (
              <div className="note-detail__collection-info">
                <span className="note-detail__collection-name">{collection.name}</span>
                <span className="note-detail__collection-count">
                  {t('note.collectionNoteCount', { count: collection.noteCount ?? 0 })}
                </span>
              </div>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default NoteDetail;
