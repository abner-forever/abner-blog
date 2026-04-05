import type { Moment } from "./moment";
import type { User } from "./user";

export interface MomentFavorite {
  id: number;
  user: User;
  moment: Moment;
  createdAt: string;
}
