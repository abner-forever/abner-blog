import type { NoteComment } from "./noteComment";
import type { NoteFavorite } from "./noteFavorite";
import type { NoteLike } from "./noteLike";
import type { Topic } from "./topic";
import type { User } from "./user";

export interface Note {
  id: number;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  location: string;
  cover: string;
  author: User;
  topic: Topic;
  comments: NoteComment[];
  likes: NoteLike[];
  favorites: NoteFavorite[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}
