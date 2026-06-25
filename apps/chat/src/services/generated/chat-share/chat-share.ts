import { useMutation, useQuery } from '@tanstack/react-query';
import { httpMutator } from '../../http';

export const chatShareControllerCreate = (
  data: { sessionId: string; title?: string; messages?: unknown[] },
) => {
  return httpMutator<{ id: string; url: string }>({
    url: `/api/chat-share`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
};

export const useChatShareControllerCreate = () => {
  return useMutation({
    mutationFn: (params: { data: { sessionId: string; title?: string; messages?: unknown[] } }) =>
      chatShareControllerCreate(params.data),
    mutationKey: ['chatShareControllerCreate'],
  });
};

export const chatShareControllerFindOne = (
  id: string,
) => {
  return httpMutator<{ id: string; title: string; messages: unknown[] }>({
    url: `/api/chat-share/${id}`,
    method: 'GET',
  });
};

export const getChatShareControllerFindOneQueryKey = (id: string) => {
  return [`/api/chat-share/${id}`] as const;
};

export const useChatShareControllerFindOne = (
  id: string,
  options?: {
    query?: {
      queryKey?: string[];
      enabled?: boolean;
    };
  },
) => {
  const queryKey = options?.query?.queryKey ?? getChatShareControllerFindOneQueryKey(id);
  return useQuery({
    queryKey,
    queryFn: () => chatShareControllerFindOne(id),
    enabled: !!id && (options?.query?.enabled !== false),
  });
};
