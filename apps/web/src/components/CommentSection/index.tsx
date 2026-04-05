import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomEmpty from '../CustomEmpty';
import Loading from '../Loading';
import {
  commentsControllerFindAll,
  commentsControllerCreate,
  commentsControllerRemove,
  commentsControllerToggleLike,
} from '../../services/generated/comments/comments';
import {
  momentsControllerGetComments,
  momentsControllerCreateComment,
  momentsControllerRemoveComment,
  momentsControllerToggleCommentLike,
} from '../../services/generated/moments/moments';
import { httpMutator } from '@services/http';
import { CommentForm } from '../CommentForm';
import { CommentItem } from '../CommentItem';
import { useAuth } from '../../hooks/useAuth';
import { useLoginModal } from '../../hooks/useLoginModal';
import './index.less';

const { Title } = Typography;

interface UnifiedComment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    avatar: string | null;
  };
  likeCount?: number;
  isLiked?: boolean;
  replyToUser?: {
    id: number;
    username: string;
    nickname?: string | null;
  };
  parentComment?: {
    id: number;
  };
}

interface NoteNestedComment {
  id: number;
  content: string;
  createdAt: string;
  likeCount?: number;
  isLiked?: boolean;
  parentId?: number | null;
  author: {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string | null;
  };
  replyToUser?: {
    id: number;
    nickname: string;
  };
  replies?: NoteNestedComment[];
}

interface ReplyTarget {
  commentId: number;
  rootId: number;
  username: string;
  userId: number;
}

interface CommentSectionProps {
  resourceType: 'blog' | 'moment' | 'note';
  resourceId: number | string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
  layout?: 'default' | 'compact';
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  resourceType,
  resourceId,
  onCommentAdded,
  onCommentDeleted,
  layout = 'default',
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { open: openLoginModal } = useLoginModal();
  const queryClient = useQueryClient();
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<
    number | null
  >(null);
  const [expandedReplyMap, setExpandedReplyMap] = useState<
    Record<number, boolean>
  >({});
  const replyFormRef = useRef<{ focus: () => void } | null>(null);
  const queryKey = useMemo(
    () => ['comments', resourceType, resourceId],
    [resourceId, resourceType],
  );

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      resourceType === 'blog'
        ? (commentsControllerFindAll(resourceId.toString()) as Promise<
            UnifiedComment[]
          >)
        : resourceType === 'moment'
          ? (momentsControllerGetComments(resourceId.toString()) as Promise<
              UnifiedComment[]
            >)
          : (httpMutator<NoteNestedComment[]>({
              url: `/api/notes/${resourceId}/comments`,
              method: 'GET',
            }).then((noteComments) => {
              const flattened: UnifiedComment[] = [];
              noteComments.forEach((root) => {
                flattened.push({
                  id: root.id,
                  content: root.content,
                  createdAt: root.createdAt,
                  updatedAt: root.createdAt,
                  author: {
                    id: root.author.id,
                    username: root.author.username,
                    avatar: root.author.avatar ?? null,
                  },
                  likeCount: root.likeCount,
                  isLiked: root.isLiked,
                  replyToUser: root.replyToUser
                    ? {
                        id: root.replyToUser.id,
                        username: root.replyToUser.nickname,
                        nickname: root.replyToUser.nickname,
                      }
                    : undefined,
                });
                (root.replies || []).forEach((reply) => {
                  flattened.push({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    updatedAt: reply.createdAt,
                    author: {
                      id: reply.author.id,
                      username: reply.author.username,
                      avatar: reply.author.avatar ?? null,
                    },
                    likeCount: reply.likeCount,
                    isLiked: reply.isLiked,
                    replyToUser: reply.replyToUser
                      ? {
                          id: reply.replyToUser.id,
                          username: reply.replyToUser.nickname,
                          nickname: reply.replyToUser.nickname,
                        }
                      : undefined,
                    parentComment: {
                      id: reply.parentId || root.id,
                    },
                  });
                });
              });
              return flattened;
            }) as Promise<
            UnifiedComment[]
          >),
  });

  const normalizedComments: UnifiedComment[] = useMemo(
    () =>
      comments.map((item) => ({
        id: item.id,
        content: item.content,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        author: {
          id: item.author.id,
          username: item.author.username,
          avatar: item.author.avatar ?? null,
        },
        likeCount: item.likeCount,
        isLiked: item.isLiked,
        replyToUser: item.replyToUser,
        parentComment: item.parentComment,
      })),
    [comments],
  );

  const { rootComments, repliesByParent, rootIdByCommentId } = useMemo(() => {
    const groupedReplies: Record<number, UnifiedComment[]> = {};
    const rootList: UnifiedComment[] = [];
    const idSet = new Set<number>(normalizedComments.map((item) => item.id));
    const commentMap = new Map<number, UnifiedComment>(
      normalizedComments.map((item) => [item.id, item]),
    );
    const rootMap = new Map<number, number>();

    const resolveRootId = (commentId: number): number => {
      const cached = rootMap.get(commentId);
      if (cached) return cached;
      let current = commentMap.get(commentId);
      while (
        current?.parentComment?.id &&
        idSet.has(current.parentComment.id)
      ) {
        const next = commentMap.get(current.parentComment.id);
        if (!next) break;
        current = next;
      }
      const rootId = current?.id || commentId;
      rootMap.set(commentId, rootId);
      return rootId;
    };

    normalizedComments.forEach((item) => {
      const parentId = item.parentComment?.id;
      if (!parentId || !idSet.has(parentId)) {
        rootList.push(item);
        rootMap.set(item.id, item.id);
        return;
      }
      const rootId = resolveRootId(item.id);
      if (!groupedReplies[rootId]) {
        groupedReplies[rootId] = [];
      }
      groupedReplies[rootId].push(item);
    });

    return {
      rootComments: rootList,
      repliesByParent: groupedReplies,
      rootIdByCommentId: rootMap,
    };
  }, [normalizedComments]);

  const addMutation = useMutation({
    mutationFn: (data: {
      content: string;
      replyTarget?: ReplyTarget | null;
    }) => {
      const { content, replyTarget: rt } = data;
      if (resourceType === 'blog') {
        return commentsControllerCreate(resourceId.toString(), {
          content,
          parentId: rt?.rootId,
          replyToUserId: rt?.userId,
        } as Parameters<typeof commentsControllerCreate>[1]);
      }
      if (resourceType === 'moment') {
        return momentsControllerCreateComment(resourceId.toString(), {
          content,
          parentId: rt?.rootId,
          replyToUserId: rt?.userId,
        } as Parameters<typeof momentsControllerCreateComment>[1]);
      }
      return httpMutator({
        url: `/api/notes/${resourceId}/comments`,
        method: 'POST',
        data: {
          content,
          parentId: rt?.rootId,
          replyToUserId: rt?.userId,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onCommentAdded?.();
      message.success(t('comment.addSuccess'));
      setReplyTarget(null);
      setActiveReplyCommentId(null);
    },
    onError: () => {
      message.error(t('comment.addFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) =>
      resourceType === 'blog'
        ? commentsControllerRemove(resourceId, commentId.toString())
        : resourceType === 'moment'
          ? momentsControllerRemoveComment(commentId.toString())
          : httpMutator({
              url: `/api/notes/comments/${commentId}`,
              method: 'DELETE',
            }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onCommentDeleted?.();
      message.success(t('comment.deleteSuccess'));
    },
    onError: () => {
      message.error(t('comment.deleteFailed'));
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId: number) => {
      if (resourceType === 'blog') {
        return commentsControllerToggleLike(resourceId, commentId.toString());
      }
      if (resourceType === 'moment') {
        return momentsControllerToggleCommentLike(commentId.toString());
      }
      return httpMutator({
        url: `/api/notes/comments/${commentId}/like`,
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });

  const handleAddComment = useCallback(
    (content: string) => {
      if (!user) {
        openLoginModal();
        return;
      }
      addMutation.mutate({ content, replyTarget });
    },
    [user, openLoginModal, addMutation, replyTarget],
  );

  const handleDeleteComment = useCallback(
    (commentId: number) => {
      deleteMutation.mutate(commentId);
    },
    [deleteMutation],
  );

  const handleLikeComment = useCallback(
    async (commentId: number) => {
      if (!user) {
        openLoginModal();
        return;
      }
      await likeMutation.mutateAsync(commentId);
    },
    [likeMutation, openLoginModal, user],
  );

  const handleReply = useCallback(
    (commentId: number, username: string) => {
      const targetComment = normalizedComments.find(
        (item) => item.id === commentId,
      );
      if (!targetComment) return;
      const rootId = rootIdByCommentId.get(commentId) || commentId;
      const newReplyTarget = {
        commentId,
        rootId,
        username,
        userId: targetComment.author.id,
      };

      // 如果点击的是同一个评论的回复按钮，切换显示状态
      if (
        activeReplyCommentId === commentId &&
        replyTarget?.commentId === commentId
      ) {
        setActiveReplyCommentId(null);
        setReplyTarget(null);
      } else {
        setReplyTarget(newReplyTarget);
        setActiveReplyCommentId(commentId);
      }
    },
    [normalizedComments, rootIdByCommentId, activeReplyCommentId, replyTarget],
  );

  const toggleReplies = useCallback((commentId: number) => {
    setExpandedReplyMap((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTarget(null);
    setActiveReplyCommentId(null);
  }, []);

  // 当回复目标改变时，自动聚焦回复框
  useEffect(() => {
    if (activeReplyCommentId && replyFormRef.current) {
      setTimeout(() => {
        replyFormRef.current?.focus?.();
      }, 100);
    }
  }, [activeReplyCommentId]);

  if (isLoading) {
    return (
      <div className="comment-loading">
        <Loading tip={t('comment.loading')} />
      </div>
    );
  }

  return (
    <div
      className={`comment-section ${layout === 'compact' ? 'compact' : ''}`}
      id="comments-section"
    >
      <Title level={4} className="comment-title">
        {t('comment.title')} ({comments.length})
      </Title>

      <CommentForm
        onSubmit={handleAddComment}
        loading={addMutation.isPending}
        replyLabel={
          replyTarget && !activeReplyCommentId
            ? replyTarget.username
            : undefined
        }
        onCancelReply={cancelReply}
      />

      <div className="comment-list">
        {comments.length === 0 ? (
          <CustomEmpty tip={t('comment.emptyPrompt')} />
        ) : (
          rootComments.map((comment) => {
            const replies = repliesByParent[comment.id] || [];
            const isExpanded = expandedReplyMap[comment.id] ?? false;
            const visibleReplies = isExpanded ? replies : replies.slice(0, 2);
            const hiddenCount = replies.length - visibleReplies.length;
            const isReplyingToThis =
              activeReplyCommentId === comment.id &&
              replyTarget?.commentId === comment.id;

            return (
              <div key={comment.id} className="comment-thread">
                <CommentItem
                  comment={comment}
                  variant="root"
                  canDelete={user?.id === comment.author?.id}
                  onDelete={async () => {
                    handleDeleteComment(comment.id);
                  }}
                  onLike={async () => {
                    await handleLikeComment(comment.id);
                  }}
                  onReply={() =>
                    handleReply(comment.id, comment.author.username)
                  }
                />

                {/* 回复表单 - 掘金风格，显示在评论下方 */}
                {isReplyingToThis && (
                  <div className="inline-reply-form">
                    <CommentForm
                      ref={replyFormRef}
                      onSubmit={(content) => {
                        if (!user) {
                          openLoginModal();
                          return;
                        }
                        addMutation.mutate({
                          content,
                          replyTarget: {
                            commentId: replyTarget.commentId,
                            rootId: replyTarget.rootId,
                            username: replyTarget.username,
                            userId: replyTarget.userId,
                          },
                        });
                      }}
                      loading={addMutation.isPending}
                      replyLabel={replyTarget.username}
                      onCancelReply={cancelReply}
                      placeholder={`回复 @${replyTarget.username}：`}
                    />
                  </div>
                )}

                {replies.length > 0 && (
                  <div className="comment-replies-block">
                    {replies.length > 2 && (
                      <button
                        type="button"
                        className="reply-toggle-btn"
                        onClick={() => toggleReplies(comment.id)}
                      >
                        {isExpanded
                          ? t('comment.collapseReplies')
                          : t('comment.expandRemainingReplies', {
                              count: hiddenCount,
                            })}
                      </button>
                    )}

                    <div className="comment-replies-list">
                      {visibleReplies.map((reply) => {
                        const isReplyReplying =
                          activeReplyCommentId === reply.id &&
                          replyTarget?.commentId === reply.id;
                        return (
                          <div key={reply.id} className="reply-item-wrapper">
                            <CommentItem
                              comment={reply}
                              variant="reply"
                              canDelete={user?.id === reply.author?.id}
                              onDelete={async () => {
                                handleDeleteComment(reply.id);
                              }}
                              onLike={async () => {
                                await handleLikeComment(reply.id);
                              }}
                              onReply={() =>
                                handleReply(reply.id, reply.author.username)
                              }
                            />

                            {/* 回复的回复表单 */}
                            {isReplyReplying && (
                              <div className="inline-reply-form">
                                <CommentForm
                                  onSubmit={(content) => {
                                    if (!user) {
                                      openLoginModal();
                                      return;
                                    }
                                    addMutation.mutate({
                                      content,
                                      replyTarget: {
                                        commentId: replyTarget.commentId,
                                        rootId: replyTarget.rootId,
                                        username: replyTarget.username,
                                        userId: replyTarget.userId,
                                      },
                                    });
                                  }}
                                  loading={addMutation.isPending}
                                  replyLabel={replyTarget.username}
                                  onCancelReply={cancelReply}
                                  placeholder={`回复 @${replyTarget.username}：`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
