import type { NoteCollectionItem } from "./noteCollectionItem";
import type { User } from "./user";

export interface NoteCollection {
  id: number;
  name: string;
  description: string;
  user: User;
  items: NoteCollectionItem[];
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}
