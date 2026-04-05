import type { Comment } from "./comment";
import type { Favorite } from "./favorite";
import type { Like } from "./like";
import type { User } from "./user";

export interface Blog {
  id: number;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  isPublished: boolean;
  /** @nullable */
  cover: string | null;
  /** @nullable */
  mdTheme: string | null;
  author: User;
  comments: Comment[];
  likes: Like[];
  favorites: Favorite[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
