import type { Note } from "./note";
import type { NoteCommentLike } from "./noteCommentLike";
import type { User } from "./user";

export interface NoteComment {
  id: number;
  content: string;
  note: Note;
  author: User;
  parentId: number;
  replyToUser: User;
  likeCount: number;
  likes: NoteCommentLike[];
  createdAt: string;
}
