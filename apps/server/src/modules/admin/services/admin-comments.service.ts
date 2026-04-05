import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../../entities/comment.entity';
import { MomentComment } from '../../../entities/moment-comment.entity';
import {
  CommentManageQueryDto,
  BatchDeleteCommentsDto,
} from '../dto/comment-manage.dto';

interface BlogCommentWithAuthor {
  id: number;
  content: string;
  createdAt: Date;
  author?: {
    id: number;
    username: string;
  };
  blog?: {
    id: number;
    title: string;
  };
}

interface MomentCommentWithRelations {
  id: number;
  content: string;
  createdAt: Date;
  author?: {
    id: number;
    username: string;
  };
  moment?: {
    id: number;
    topic?: {
      id: number;
      name: string;
    };
  };
}

@Injectable()
export class AdminCommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(MomentComment)
    private readonly momentCommentRepository: Repository<MomentComment>,
  ) {}

  async getBlogComments(query: CommentManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const blogIdNum = query.blogId ? parseInt(query.blogId, 10) : undefined;
    const { keyword } = query;
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.blog', 'blog')
      .select([
        'comment',
        'author.id',
        'author.username',
        'blog.id',
        'blog.title',
      ]);

    if (blogIdNum) {
      qb.where('comment.blogId = :blogId', { blogId: blogIdNum });
    }
    if (keyword) {
      qb.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('comment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((comment) => {
        const author = comment.author as
          | BlogCommentWithAuthor['author']
          | undefined;
        const blog = comment.blog as BlogCommentWithAuthor['blog'] | undefined;
        return {
          ...comment,
          authorUsername: author?.username,
          authorId: author?.id,
          blogTitle: blog?.title,
          blogId: blog?.id,
        };
      }),
      total,
    };
  }

  async getTopicComments(query: CommentManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const momentIdNum = query.topicId ? parseInt(query.topicId, 10) : undefined;
    const { keyword } = query;
    const qb = this.momentCommentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.moment', 'moment')
      .leftJoinAndSelect('moment.topic', 'topic')
      .select([
        'comment',
        'author.id',
        'author.username',
        'moment.id',
        'topic.id',
        'topic.name',
      ]);

    if (momentIdNum) {
      qb.where('moment.id = :momentId', { momentId: momentIdNum });
    }
    if (keyword) {
      qb.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('comment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((comment) => {
        const author = comment.author as
          | MomentCommentWithRelations['author']
          | undefined;
        const moment = comment.moment as
          | MomentCommentWithRelations['moment']
          | undefined;
        return {
          id: comment.id,
          content: comment.content,
          authorUsername: author?.username,
          authorId: author?.id,
          topicName: moment?.topic?.name,
          topicId: moment?.topic?.id,
          createdAt: comment.createdAt,
        };
      }),
      total,
    };
  }

  async getComments(query: CommentManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const blogIdNum = query.blogId ? parseInt(query.blogId, 10) : undefined;
    const { keyword } = query;
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.blog', 'blog')
      .select([
        'comment',
        'author.id',
        'author.username',
        'blog.id',
        'blog.title',
      ]);

    if (blogIdNum) {
      qb.where('comment.blogId = :blogId', { blogId: blogIdNum });
    }
    if (keyword) {
      qb.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('comment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((comment) => {
        const author = comment.author as
          | BlogCommentWithAuthor['author']
          | undefined;
        const blog = comment.blog as BlogCommentWithAuthor['blog'] | undefined;
        return {
          ...comment,
          authorUsername: author?.username,
          authorId: author?.id,
          blogTitle: blog?.title,
          blogId: blog?.id,
        };
      }),
      total,
    };
  }

  async deleteComment(id: number) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    await this.commentRepository.remove(comment);
  }

  async batchDeleteComments(dto: BatchDeleteCommentsDto) {
    await this.commentRepository.delete(dto.ids);
  }
}
