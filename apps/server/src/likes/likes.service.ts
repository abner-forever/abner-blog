import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../entities/like.entity';
import { Blog } from '../entities/blog.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Blog)
    private blogsRepository: Repository<Blog>,
  ) {}

  async toggleLike(
    blogId: number,
    userId: number,
  ): Promise<{ liked: boolean }> {
    const blog = await this.blogsRepository.findOne({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        blog: { id: blogId },
        user: { id: userId },
      },
    });

    if (existingLike) {
      await this.likesRepository.remove(existingLike);
      return { liked: false };
    }

    const like = this.likesRepository.create({
      blog: { id: blogId },
      user: { id: userId },
    });

    await this.likesRepository.save(like);
    return { liked: true };
  }

  async getLikesCount(blogId: number): Promise<number> {
    return this.likesRepository.count({
      where: { blog: { id: blogId } },
    });
  }

  async hasLiked(blogId: number, userId: number): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: {
        blog: { id: blogId },
        user: { id: userId },
      },
    });
    return !!like;
  }
}
