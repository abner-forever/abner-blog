import type { Blog } from "./blog";
import type { Comment as __Comment } from "./comment";
import type { User } from "./user";

export interface Comment {
  id: number;
  content: string;
  author: User;
  blog: Blog;
  likeCount: number;
  isEdited: boolean;
  parentComment?: __Comment;
  replyToUser?: User;
  createdAt: string;
  updatedAt: string;
}
