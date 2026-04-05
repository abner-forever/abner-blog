import { blogsControllerFindOne } from '@services/generated/blogs/blogs';
import { useQuery } from '@tanstack/react-query';

export const useBlog = (id: string) => {
  return useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogsControllerFindOne(id),
    enabled: !!id,
  });
};
