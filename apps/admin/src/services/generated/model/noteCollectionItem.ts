import type { Note } from "./note";
import type { NoteCollection } from "./noteCollection";
import type { User } from "./user";

export interface NoteCollectionItem {
  id: number;
  collection: NoteCollection;
  note: Note;
  user: User;
  createdAt: string;
}
