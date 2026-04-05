import type { Note } from "./note";
import type { User } from "./user";

export interface NoteLike {
  id: number;
  note: Note;
  user: User;
  createdAt: string;
}
