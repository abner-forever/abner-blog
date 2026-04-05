import { useQuery } from '@tanstack/react-query';
import { httpMutator } from '@services/http';
import type {
  MomentsControllerFindAllParams,
  MomentListResponseDto,
} from '@services/generated/model';

export const useMoments = (params: MomentsControllerFindAllParams) => {
  return useQuery({
    queryKey: ['moments', params],
    queryFn: () =>
      httpMutator<MomentListResponseDto>({
        url: '/api/moments',
        method: 'GET',
        params,
      }),
  });
};
