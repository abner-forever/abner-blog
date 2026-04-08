import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { httpMutator } from '@services/http';
import type {
  CommentDto,
  CreateNoteCommentDto,
} from '@services/generated/model';

export interface NoteListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  topicId?: number;
  sortBy?: 'time' | 'hot';
}

export interface NoteListResponse {
  list: NoteDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NoteDetail {
  id: number;
  title?: string;
  content: string;
  images: string[];
  videos: string[];
  cover?: string;
  location?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: string;
  author: {
    id: number;
    nickname: string;
    username: string;
    avatar: string;
  };
  topic?: {
    id: number;
    name: string;
  };
}

export interface NestedNoteComment extends Omit<CommentDto, 'parentComment'> {
  parentId: number | null;
  isLiked: boolean;
  replies: NestedNoteComment[];
}

// 获取笔记列表
export const useNotes = (params: NoteListParams) => {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () =>
      httpMutator<NoteListResponse>({
        url: '/api/notes',
        method: 'GET',
        params,
      }),
  });
};

export const useInfiniteNotes = (
  params: Omit<NoteListParams, 'page'> & { pageSize?: number }
) => {
  return useInfiniteQuery({
    queryKey: ['notes', 'infinite', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      httpMutator<NoteListResponse>({
        url: '/api/notes',
        method: 'GET',
        params: {
          ...params,
          page: pageParam,
        },
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) {
        return undefined;
      }
      return lastPage.page + 1;
    },
  });
};

// 获取笔记详情
export const useNoteDetail = (id: number) => {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () =>
      httpMutator<NoteDetail>({
        url: `/api/notes/${id}`,
        method: 'GET',
      }),
    enabled: !!id,
  });
};

// 获取笔记评论（嵌套结构）
export const useNoteComments = (noteId: number) => {
  return useQuery({
    queryKey: ['noteComments', noteId],
    queryFn: () =>
      httpMutator<NestedNoteComment[]>({
        url: `/api/notes/${noteId}/comments`,
        method: 'GET',
      }),
    enabled: !!noteId,
  });
};

// 创建笔记
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?: string;
      content: string;
      images?: string[];
      videos?: string[];
      cover?: string;
      topicId?: number;
      location?: string;
    }) =>
      httpMutator({
        url: '/api/notes',
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// 点赞笔记
export const useToggleNoteLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) =>
      httpMutator<{ isLiked: boolean }>({
        url: `/api/notes/${noteId}/like`,
        method: 'POST',
      }),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    },
  });
};

// 收藏笔记（旧接口，保持兼容）
export const useToggleNoteFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) =>
      httpMutator<{ isFavorited: boolean }>({
        url: `/api/notes/${noteId}/favorite`,
        method: 'POST',
      }),
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    },
  });
};

// 创建评论（支持嵌套回复）
export const useCreateNoteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      content,
      parentId,
      replyToUserId,
    }: {
      noteId: number;
      content: string;
      parentId?: number;
      replyToUserId?: number;
    }) => {
      const data: CreateNoteCommentDto = { content };
      if (parentId !== undefined) {
        data.parentId = parentId;
      }
      if (replyToUserId !== undefined) {
        data.replyToUserId = replyToUserId;
      }
      return httpMutator({
        url: `/api/notes/${noteId}/comments`,
        method: 'POST',
        data,
      });
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['noteComments', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    },
  });
};

// 删除笔记
export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) =>
      httpMutator({
        url: `/api/notes/${noteId}`,
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// 点赞评论
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) =>
      httpMutator<{ isLiked: boolean }>({
        url: `/api/notes/comments/${commentId}/like`,
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noteComments'] });
    },
  });
};

// 收藏笔记到指定收藏夹
export const useCollectNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      collectionId,
    }: {
      noteId: number;
      collectionId: number;
    }) =>
      httpMutator({
        url: `/api/notes/${noteId}/collect`,
        method: 'POST',
        data: { collectionId },
      }),
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['noteComments', noteId] });
      queryClient.invalidateQueries({ queryKey: ['noteCollections'] });
    },
  });
};
