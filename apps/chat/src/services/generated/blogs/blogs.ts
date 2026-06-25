import { httpMutator } from '../../http';
import type { CreateBlogDto } from '../model';

export const blogsControllerCreate = (
  createBlogDto: CreateBlogDto,
) => {
  return httpMutator<{ id: number; title: string }>({
    url: `/api/blogs`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: createBlogDto,
  });
};
