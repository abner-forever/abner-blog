import React from 'react';
import Loading from '../Loading';
import CustomEmpty from '../CustomEmpty';
import { CommentItem } from '../CommentItem';
import './index.less';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    username: string;
    avatar: string | null;
  };
  likes: number;
  isLiked: boolean;
  replyTo?: {
    id: number;
    username: string;
  };
}

interface CommentListProps {
  comments: Comment[];
  loading?: boolean;
  onLike: (id: number) => Promise<void>;
  onReply: (id: number, username: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  loading = false,
  onLike,
  onReply,
}) => {
  if (loading) {
    return (
      <div className="comment-list">
        <div className="comment-list-loading">
          <Loading />
        </div>
      </div>
    );
  }

  if (!comments.length) {
    return (
      <div className="comment-list">
        <div className="comment-list-empty">
          <CustomEmpty tip="暂无评论" />
        </div>
      </div>
    );
  }

  return (
    <div className="comment-list">
      <div className="comment-list-header">
        <div className="title">评论</div>
        <div className="count">{comments.length} 条评论</div>
      </div>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onLike={() => onLike(comment.id)}
          onReply={() => onReply(comment.id, comment.author.username)}
        />
      ))}
    </div>
  );
};

export { CommentList };
