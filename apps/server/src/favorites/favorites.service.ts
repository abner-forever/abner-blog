import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Blog } from '../entities/blog.entity';
import { User } from '../entities/user.entity';

interface CountResult {
  blogId: number;
  count: string | number;
}

interface BlogIdResult {
  blogId: number;
}

@Injectable()
export class FavoritesService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.logger = new Logger(FavoritesService.name);
  }

  async toggleFavorite(blogId: number, userId: number) {
    const blog = await this.blogRepository.findOne({ where: { id: blogId } });
    if (!blog) throw new NotFoundException('博客不存在');
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    const existing = await this.favoriteRepository.findOne({
      where: { blog: { id: blogId }, user: { id: userId } },
    });
    if (existing) {
      await this.favoriteRepository.remove(existing);
      return { favorited: false };
    } else {
      const favorite = this.favoriteRepository.create({ blog, user });
      await this.favoriteRepository.save(favorite);
      return { favorited: true };
    }
  }

  async getFavoritesCount(blogId: number) {
    return this.favoriteRepository.count({ where: { blog: { id: blogId } } });
  }

  async hasFavorited(blogId: number, userId: number) {
    const favorite = await this.favoriteRepository.findOne({
      where: { blog: { id: blogId }, user: { id: userId } },
    });
    return { isFavorited: !!favorite };
  }

  async getUserFavorites(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const favorites = await this.favoriteRepository.find({
      where: { user: { id: userId } },
      relations: {
        blog: {
          author: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    if (favorites.length === 0) {
      return [];
    }

    const blogIds = favorites.map((fav) => fav.blog.id);

    // 批量获取点赞数
    const likesCountResult: CountResult[] = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoin('blog.likes', 'like')
      .select('blog.id', 'blogId')
      .addSelect('COUNT(like.id)', 'count')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .groupBy('blog.id')
      .getRawMany();

    const likesCountMap = new Map(
      likesCountResult.map((item) => [
        item.blogId,
        typeof item.count === 'string' ? parseInt(item.count, 10) : item.count,
      ]),
    );

    // 批量获取收藏数
    const favoritesCountResult: CountResult[] = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoin('blog.favorites', 'favorite')
      .select('blog.id', 'blogId')
      .addSelect('COUNT(favorite.id)', 'count')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .groupBy('blog.id')
      .getRawMany();

    const favoritesCountMap = new Map(
      favoritesCountResult.map((item) => [
        item.blogId,
        typeof item.count === 'string' ? parseInt(item.count, 10) : item.count,
      ]),
    );

    // 批量获取当前用户的点赞状态
    const userLikes: BlogIdResult[] = await this.blogRepository
      .createQueryBuilder('blog')
      .innerJoin('blog.likes', 'like')
      .innerJoin('like.user', 'user')
      .select('blog.id', 'blogId')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .andWhere('user.id = :userId', { userId })
      .getRawMany();

    const userLikesMap = new Map(userLikes.map((item) => [item.blogId, true]));

    return favorites.map((fav) => ({
      ...fav.blog,
      author: fav.blog.author
        ? {
            id: fav.blog.author.id,
            username: fav.blog.author.username,
            avatar: fav.blog.author.avatar,
          }
        : undefined,
      likesCount: likesCountMap.get(fav.blog.id) || 0,
      favoritesCount: favoritesCountMap.get(fav.blog.id) || 0,
      isLiked: userLikesMap.get(fav.blog.id) || false,
      isFavorited: true, // 因为是“我的收藏”列表，肯定都是已收藏的
    }));
  }
}
