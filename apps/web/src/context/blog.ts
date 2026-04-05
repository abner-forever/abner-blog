import { createContext } from 'react';
import type { BlogDto } from '@services/generated/model';

export const BlogContext = createContext<BlogDto[]>([]);
