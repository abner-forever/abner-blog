import type { Moment } from "./moment";
import type { Note } from "./note";

export interface Topic {
  id: number;
  name: string;
  description: string;
  cover: string;
  icon: string;
  color: string;
  isSystem: boolean;
  isHot: boolean;
  momentCount: number;
  noteCount: number;
  followCount: number;
  moments: Moment[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}
