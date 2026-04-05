import type { Moment } from "./moment";
import type { MomentComment as __MomentComment } from "./momentComment";
import type { User } from "./user";

export interface MomentComment {
  id: number;
  content: string;
  author: User;
  moment: Moment;
  likeCount: number;
  isEdited: boolean;
  parentComment?: __MomentComment;
  replyToUser?: User;
  createdAt: string;
  updatedAt: string;
}
