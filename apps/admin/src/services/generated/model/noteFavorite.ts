import type { Note } from "./note";
import type { User } from "./user";

export interface NoteFavorite {
  id: number;
  note: Note;
  user: User;
  /** 由「收藏到收藏夹」自动创建；取消全部收藏夹项时可安全删除，不影响仅通过 /favorite 接口收藏的记录 */
  syncedFromCollection: boolean;
  createdAt: string;
}
