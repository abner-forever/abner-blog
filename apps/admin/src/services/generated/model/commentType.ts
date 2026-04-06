/**
 * 评论列表
 */
export type CommentType = (typeof CommentType)[keyof typeof CommentType];

export const CommentType = {} as const;
