import type { Blog } from "./blog";
import type { User } from "./user";

export interface Favorite {
  id: number;
  user: User;
  blog: Blog;
  createdAt: string;
}
