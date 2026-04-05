import type { NoteComment } from "./noteComment";
import type { User } from "./user";

export interface NoteCommentLike {
  id: number;
  comment: NoteComment;
  user: User;
  createdAt: string;
}
