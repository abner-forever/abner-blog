export interface CommentResponse {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
  likeCount: number;
  isLiked: boolean;
  parentComment?: {
    id: number;
  };
  replyToUser?: {
    id: number;
    username: string;
  };
  blog: {
    id: number;
    title: string;
  };
}
