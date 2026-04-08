import { useQuery } from '@tanstack/react-query';
import { httpMutator } from '@services/http';
import type {
  MomentsControllerFindAllParams,
  MomentListResponse,
} from '@services/generated/model';

export const useMoments = (params: MomentsControllerFindAllParams) => {
  return useQuery({
    queryKey: ['moments', params],
    queryFn: () =>
      httpMutator<MomentListResponse>({
        url: '/api/moments',
        method: 'GET',
        params,
      }),
  });
};
