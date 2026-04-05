import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpMutator } from '@services/http';

export interface NoteCollection {
  id: number;
  name: string;
  description?: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

// 获取我的收藏夹列表
export const useMyCollections = () => {
  return useQuery({
    queryKey: ['noteCollections'],
    queryFn: () =>
      httpMutator<NoteCollection[]>({
        url: '/api/note-collections',
        method: 'GET',
      }),
  });
};

// 创建收藏夹
export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      httpMutator<NoteCollection>({
        url: '/api/note-collections',
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noteCollections'] });
    },
  });
};

// 删除收藏夹
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: number) =>
      httpMutator({
        url: `/api/note-collections/${collectionId}`,
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noteCollections'] });
    },
  });
};

// 获取收藏夹详情
export const useCollectionDetail = (collectionId: number) => {
  return useQuery({
    queryKey: ['noteCollection', collectionId],
    queryFn: () =>
      httpMutator<NoteCollection & { notes: unknown[] }>({
        url: `/api/note-collections/${collectionId}`,
        method: 'GET',
      }),
    enabled: !!collectionId,
  });
};
